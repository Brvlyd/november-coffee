import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Prepare FormData for OCR.space API
    const ocrFormData = new FormData();
    ocrFormData.append('file', file);
    ocrFormData.append('language', 'eng');
    ocrFormData.append('isOverlayRequired', 'false');
    ocrFormData.append('detectOrientation', 'true');
    ocrFormData.append('scale', 'true');
    ocrFormData.append('OCREngine', '2'); // Engine 2 is better for complex images
    ocrFormData.append('isTable', 'true'); // Enable receipt scanning mode for better accuracy

    // Call OCR.space API
    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': process.env.OCR_SPACE_API_KEY || 'K81729156788957',
      },
      body: ocrFormData,
    });

    const ocrResult = await ocrResponse.json();

    if (!ocrResult.IsErroredOnProcessing && ocrResult.ParsedResults?.[0]) {
      const extractedText = ocrResult.ParsedResults[0].ParsedText;
      
      // Parse the extracted text to structure data
      const data = parseNotaText(extractedText);

      return NextResponse.json({ 
        success: true, 
        data,
        rawText: extractedText // for debugging
      });
    } else {
      return NextResponse.json(
        { error: ocrResult.ErrorMessage?.[0] || 'OCR processing failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing nota:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process nota' },
      { status: 500 }
    );
  }
}

// Parse plain text from OCR into structured data
function parseNotaText(text: string) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  const items: any[] = [];
  let supplier = '';
  let tanggal = '';
  let total = '';

  // Extract supplier (usually first few lines) - improved detection
  const supplierKeywords = ['toko', 'store', 'supplier', 'cv', 'pt', 'ud', 'distributor'];
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Skip lines that are clearly dates, totals, or too short
    if (line.length < 3 || 
        /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(line) ||
        /total|jumlah|nota|invoice|tanggal/i.test(line)) {
      continue;
    }
    // Check if line contains supplier keywords OR is first substantial line
    if (supplierKeywords.some(kw => line.toLowerCase().includes(kw)) || 
        (i === 0 && line.length > 3)) {
      supplier = extractStoreName(line);
      break;
    }
    // If no keyword match, use first non-date, non-total line
    if (!supplier && i < 3 && line.length > 3) {
      supplier = extractStoreName(line);
    }
  }

  // Look for date patterns (dd/mm/yyyy, dd-mm-yyyy, etc)
  const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/;
  for (const line of lines) {
    const dateMatch = line.match(dateRegex);
    if (dateMatch) {
      tanggal = dateMatch[1];
      break;
    }
  }

  // Look for total (usually contains "total", "jumlah", or large number at end)
  const totalRegex = /(total|jumlah|grand total|subtotal)[:\s]*[Rp.\s]*([\d.,]+)/i;
  for (const line of lines) {
    const totalMatch = line.match(totalRegex);
    if (totalMatch) {
      // Ambil angka saja, format nanti di akhir
      const cleanNumber = totalMatch[2].replace(/[.,]/g, '');
      total = cleanNumber;
      break;
    }
  }

  // Expanded coffee shop items untuk smart matching - prioritas tinggi
  const coffeeShopItems = [
    // Kopi & Biji Kopi
    'kopi', 'coffee', 'arabica', 'robusta', 'liberica', 'excelsa',
    'espresso', 'latte', 'cappuccino', 'americano', 'macchiato', 'mocha',
    'biji kopi', 'kopi bubuk', 'kopi instan', 'green bean', 'roasted',
    
    // Susu & Dairy
    'susu', 'milk', 'uht', 'fresh milk', 'full cream', 'skim milk',
    'cream', 'creamer', 'whipping cream', 'condensed milk', 'evaporated',
    'krim', 'krimer', 'susu cair', 'susu bubuk', 'dairy',
    
    // Gula & Pemanis
    'gula', 'sugar', 'gula pasir', 'gula merah', 'brown sugar', 'palm sugar',
    'madu', 'honey', 'stevia', 'sweetener', 'gula aren', 'raw sugar',
    
    // Teh & Minuman
    'teh', 'tea', 'green tea', 'black tea', 'earl grey', 'chamomile',
    'jasmine', 'oolong', 'matcha', 'hojicha', 'teh hijau', 'teh hitam',
    
    // Sirup & Saus
    'sirup', 'syrup', 'vanilla', 'caramel', 'hazelnut', 'chocolate',
    'coklat', 'sauce', 'saus', 'palm', 'monin', 'torani',
    
    // Powder & Bubuk
    'milo', 'ovaltine', 'bubuk', 'powder', 'chocolate powder',
    'cocoa', 'choco', 'oreo', 'tiramisu', 'red velvet',
    
    // Kemasan & Packaging
    'cup', 'gelas', 'paper cup', 'plastic cup', 'hot cup', 'cold cup',
    'sedotan', 'straw', 'paper straw', 'plastic straw',
    'lid', 'tutup', 'dome lid', 'flat lid',
    'box', 'paper bag', 'plastik', 'plastic', 'plastic bag',
    'tissue', 'serbet', 'napkin', 'wrapper', 'packaging',
    'sleeve', 'holder', 'carrier',
    
    // Air & Minuman Lain
    'air mineral', 'aqua', 'mineral water', 'air', 'water',
    
    // Topping & Extras
    'whipped cream', 'ice cream', 'es krim', 'topping',
    'jelly', 'pudding', 'boba', 'pearl', 'cincau',
    'almond', 'hazelnut', 'wafer', 'cookie', 'biscuit'
  ];

  // Helper function to extract all numbers from a line - CLEAN numbers only
  const extractNumbers = (line: string): number[] => {
    // Match angka dengan atau tanpa Rp, titik ribuan, atau koma
    const matches = line.match(/(?:Rp[\s.]?)?([\d]{1,3}(?:[.,][\d]{3})*(?:[.,][\d]+)?)/gi);
    if (!matches) return [];
    return matches.map(m => {
      // AGRESIF: Bersihkan SEMUA karakter non-numeric kecuali digit
      const cleaned = m.replace(/[^0-9]/g, '');
      return parseFloat(cleaned);
    }).filter(n => !isNaN(n) && n > 0);
  };

  // Helper to determine which number is quantity vs price
  const classifyNumbers = (numbers: number[], satuan?: string, line?: string) => {
    if (numbers.length === 0) return {};
    
    // Sort dari kecil ke besar
    const sorted = [...numbers].sort((a, b) => a - b);
    
    if (numbers.length === 1) {
      // Single number: kalau < 100 kemungkinan jumlah, kalau >= 1000 kemungkinan harga total
      return numbers[0] < 100 ? { jumlah: numbers[0] } : { harga_total: numbers[0] };
    }
    
    if (numbers.length === 2) {
      // Two numbers: yang lebih kecil = jumlah, yang lebih besar = harga total
      // Pastikan yang pertama memang jumlah (< 1000) dan yang kedua harga (>= 1000)
      if (sorted[0] < 1000 && sorted[1] >= 1000) {
        return { jumlah: sorted[0], harga_total: sorted[1] };
      }
      // Jika keduanya kecil, yang pertama jumlah, kedua mungkin harga satuan
      if (sorted[0] < 100 && sorted[1] < 10000) {
        return { jumlah: sorted[0], harga_satuan: sorted[1] };
      }
      // Default: yang kecil = jumlah, yang besar = total
      return { jumlah: sorted[0], harga_total: sorted[1] };
    }
    
    if (numbers.length >= 3) {
      // Three+ numbers: yang terkecil = jumlah, menengah = harga satuan, terbesar = harga total
      // Filter: jumlah harus < 1000, harga satuan < harga total
      const potentialQty = sorted[0];
      const potentialUnitPrice = sorted[1];
      const potentialTotal = sorted[sorted.length - 1]; // ambil yang terbesar
      
      // Validasi: jumlah harus masuk akal (< 1000) dan harga satuan < harga total
      if (potentialQty < 1000 && potentialUnitPrice < potentialTotal) {
        return { 
          jumlah: potentialQty, 
          harga_satuan: potentialUnitPrice,
          harga_total: potentialTotal 
        };
      }
      
      // Fallback: ambil 3 angka pertama setelah di-sort
      return { 
        jumlah: sorted[0], 
        harga_satuan: sorted[1],
        harga_total: sorted[2] 
      };
    }
    
    return { jumlah: sorted[0] };
  };

  // Parse items with multiple pattern attempts - prioritize coffee shop items
  for (const line of lines) {
    // Skip obvious non-item lines
    if (line === supplier || 
        line.toLowerCase().includes('total') || 
        line.toLowerCase().includes('subtotal') ||
        line.toLowerCase().includes('grand total') ||
        line.toLowerCase().includes('terima kasih') ||
        line.toLowerCase().includes('thank you') ||
        line.toLowerCase().includes('pembayaran') ||
        line.toLowerCase().includes('kembalian') ||
        line.toLowerCase().includes('tunai') ||
        line.toLowerCase().includes('cash') ||
        line.toLowerCase().includes('tanggal') ||
        line.toLowerCase().includes('nota') ||
        line.toLowerCase().includes('invoice') ||
        /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(line) || // Skip lines with dates
        line.length < 3) {
      continue;
    }

    let parsed = false;

    // PRE-PROCESS: Remove ALL "Rp" dari line untuk prevent double Rp
    const cleanLine = line.replace(/Rp/gi, '').trim();

    // Extract all numbers first dari clean line
    const numbers = extractNumbers(cleanLine);
    
    // Calculate coffee shop relevance score
    const relevanceScore = getCoffeeShopRelevanceScore(cleanLine, coffeeShopItems);
    const isCoffeeShopItem = relevanceScore > 0;

    // Pattern 1: "Nama Barang jumlah satuan harga" - Extract nama sebelum angka pertama
    const pattern1 = /^([a-zA-Z\s]+?)\s+(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)/i;
    const match1 = cleanLine.match(pattern1);
    if (match1 && !parsed) {
      const [, nama, jumlahStr, satuan] = match1;
      const jumlahValue = parseFloat(jumlahStr.replace(/[.,]/g, ''));
      
      // PRIORITAS: Coffee shop items dengan score tinggi atau ada angka valid
      // VALIDASI: jumlahValue harus masuk akal untuk jumlah (< 1000), bukan harga
      if ((isCoffeeShopItem || (numbers.length > 0 && nama.length > 2 && !nama.toLowerCase().includes('total'))) 
          && jumlahValue < 1000) {
        // Filter out jumlahValue from numbers before classifying prices
        const filteredNumbers = numbers.filter(n => n !== jumlahValue);
        const classified = classifyNumbers(filteredNumbers, satuan, line);
        
        // Clean nama dari semua angka dan symbol - murni nama barang aja
        const cleanedName = nama.trim();
        
        // Gunakan jumlahValue dari regex sebagai jumlah utama
        const finalJumlah = jumlahValue;
        let hargaSatuan = classified.harga_satuan;
        
        // Hitung harga satuan jika ada jumlah dan harga total
        if (!hargaSatuan && finalJumlah && classified.harga_total) {
          hargaSatuan = Math.round(classified.harga_total / finalJumlah);
        }
        
        if (cleanedName.length > 2) {
          items.push({
            nama_barang: cleanedName,
            jumlah: finalJumlah,
            satuan: normalizeSatuan(satuan) || 'pcs',
            kategori: categorizeItem(cleanedName),
            // STRICT: Ensure number only, tidak ada string
            harga_satuan: typeof hargaSatuan === 'number' ? hargaSatuan : undefined,
            harga_total: typeof classified.harga_total === 'number' ? classified.harga_total : undefined,
          });
          parsed = true;
        }
      }
    }

    // Pattern 2: "10 Kg Kopi 100.000" atau "2 liter Susu 50000" atau "600 ml Aqua"
    if (!parsed) {
      const pattern2 = /^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)\s+(.+)/i;
      const match2 = cleanLine.match(pattern2);
      if (match2) {
        const [, jumlahStr, satuan, nama] = match2;
        const jumlahValue = parseFloat(jumlahStr.replace(/[.,]/g, ''));
        
        // Lebih permisif dalam deteksi
        if (nama.length > 2 && !nama.toLowerCase().includes('total')) {
          // Filter out volume/weight value from numbers before classifying prices
          const filteredNumbers = numbers.filter(n => n !== jumlahValue);
          const classified = classifyNumbers(filteredNumbers, satuan, line);
          
          // Extract only item name (before any large numbers that are likely prices)
          const cleanedName = nama.split(/\s+/).filter(word => {
            // Keep words that are not large numbers (prices)
            const num = parseFloat(word.replace(/[.,]/g, ''));
            return isNaN(num) || num < 1000; // Keep non-numbers or small numbers
          }).join(' ').trim();
          
          // Gunakan jumlahValue dari regex sebagai jumlah utama
          const finalJumlah = jumlahValue;
          let hargaSatuan = classified.harga_satuan;
          
          // Hitung harga satuan jika ada jumlah dan harga total
          if (!hargaSatuan && finalJumlah && classified.harga_total) {
            hargaSatuan = Math.round(classified.harga_total / finalJumlah);
          }
          
          items.push({
            nama_barang: cleanedName,
            jumlah: finalJumlah,
            satuan: normalizeSatuan(satuan) || 'pcs',
            kategori: categorizeItem(cleanedName),
            harga_satuan: typeof hargaSatuan === 'number' ? hargaSatuan : undefined,
            harga_total: typeof classified.harga_total === 'number' ? classified.harga_total : undefined,
          });
          parsed = true;
        }
      }
    }

    // Pattern 3: "Kopi - 2kg 100000" atau "Susu : 10 liter 150.000" atau "Aqua - 600ml"
    if (!parsed) {
      const pattern3 = /^(.+?)[\s:-]+(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)/i;
      const match3 = cleanLine.match(pattern3);
      if (match3) {
        const [, nama, jumlahStr, satuan] = match3;
        const jumlahValue = parseFloat(jumlahStr.replace(/[.,]/g, ''));
        
        // VALIDASI: jumlahValue harus masuk akal untuk jumlah (< 1000 atau volume <=10000 untuk ml/gram)
        const isVolumeUnit = ['ml', 'gram', 'gr'].some(u => satuan.toLowerCase().includes(u));
        const isValidJumlah = jumlahValue < 1000 || (isVolumeUnit && jumlahValue <= 10000);
        
        if (nama.length > 2 && !nama.toLowerCase().includes('total') && isValidJumlah) {
          // Filter out volume/weight value from numbers before classifying prices
          const filteredNumbers = numbers.filter(n => n !== jumlahValue);
          const classified = classifyNumbers(filteredNumbers, satuan, line);
          
          // Clean nama dari angka besar (harga)
          const cleanedName = nama.split(/\s+/).filter(word => {
            const num = parseFloat(word.replace(/[.,]/g, ''));
            return isNaN(num) || num < 1000;
          }).join(' ').trim();
          
          // Gunakan jumlahValue dari regex sebagai jumlah utama
          const finalJumlah = jumlahValue;
          let hargaSatuan = classified.harga_satuan;
          
          // Hitung harga satuan jika ada jumlah dan harga total
          if (!hargaSatuan && finalJumlah && classified.harga_total) {
            hargaSatuan = Math.round(classified.harga_total / finalJumlah);
          }
          
          items.push({
            nama_barang: cleanedName,
            jumlah: finalJumlah,
            satuan: normalizeSatuan(satuan) || 'pcs',
            kategori: categorizeItem(cleanedName),
            harga_satuan: typeof hargaSatuan === 'number' ? hargaSatuan : undefined,
            harga_total: typeof classified.harga_total === 'number' ? classified.harga_total : undefined,
          });
          parsed = true;
        }
      }
    }

    // Pattern 4: "Nama Item 100 50.000" - nama di awal, diikuti angka
    if (!parsed) {
      const pattern4 = /^([a-zA-Z\s]+)\s+(\d+)/i;
      const match4 = cleanLine.match(pattern4);
      if (match4 && numbers.length > 0) {
        const nama = match4[1].trim();
        if (nama.length > 2 && !nama.toLowerCase().includes('total')) {
          const classified = classifyNumbers(numbers, undefined, line);
          
          // Hitung harga satuan jika ada jumlah dan harga total
          let hargaSatuan = classified.harga_satuan;
          if (!hargaSatuan && classified.jumlah && classified.harga_total) {
            hargaSatuan = Math.round(classified.harga_total / classified.jumlah);
          }
          
          items.push({
            nama_barang: cleanItemName(nama),
            jumlah: classified.jumlah || 1,
            satuan: 'pcs',
            kategori: categorizeItem(nama),
            harga_satuan: typeof hargaSatuan === 'number' ? hargaSatuan : undefined,
            harga_total: typeof classified.harga_total === 'number' ? classified.harga_total : undefined,
          });
          parsed = true;
        }
      }
    }

    // Pattern 5 (Fallback): Coffee shop items dengan valid numbers
    if (!parsed && numbers.length > 0 && isCoffeeShopItem) {
      // Extract item name (remove all numbers and extra symbols)
      const nama = cleanLine.replace(/[\d.,@=\s-]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (nama.length > 2 && !nama.toLowerCase().includes('total') && 
          !nama.toLowerCase().includes('jumlah')) {
        const classified = classifyNumbers(numbers, undefined, line);
        items.push({
          nama_barang: cleanItemName(nama),
          jumlah: classified.jumlah || 1,
          satuan: 'pcs',
          kategori: categorizeItem(nama),
          harga_satuan: typeof classified.harga_satuan === 'number' ? classified.harga_satuan : undefined,
          harga_total: typeof classified.harga_total === 'number' ? classified.harga_total : undefined,
          relevance: relevanceScore, // Track relevance for debugging
        });
      }
    }
  }

  // Format semua harga ke format rupiah - dengan FINAL sanitization
  const formattedItems = items.map(item => {
    // Sanitize: jika somehow masih ada string, convert ke number
    const satuanNum = typeof item.harga_satuan === 'string' 
      ? parseFloat(item.harga_satuan.replace(/[^0-9]/g, ''))
      : item.harga_satuan;
    const totalNum = typeof item.harga_total === 'string'
      ? parseFloat(item.harga_total.replace(/[^0-9]/g, ''))
      : item.harga_total;
    
    // Format dengan formatRupiah
    const formattedSatuan = satuanNum ? formatRupiah(satuanNum) : undefined;
    const formattedTotal = totalNum ? formatRupiah(totalNum) : undefined;
    
    return {
      ...item,
      // FINAL SANITIZE: ensure no double "Rp Rp"
      harga_satuan: sanitizeRupiah(formattedSatuan),
      harga_total: sanitizeRupiah(formattedTotal),
    };
  });

  // Format total - pastikan clean number dan no double Rp
  const totalNumber = parseFloat(total.replace(/[^0-9]/g, '')) || 0;
  const formattedTotal = totalNumber > 0 ? formatRupiah(totalNumber) : undefined;

  return {
    items: formattedItems,
    supplier: supplier || undefined,
    tanggal: tanggal || undefined,
    total: sanitizeRupiah(formattedTotal),
  };
}

// Helper: Format number to Rupiah - ONLY accept clean numbers
function formatRupiah(amount: number | string): string | undefined {
  // Sanitize: jika input string, convert ke number dan remove ALL non-numeric
  let numAmount: number;
  if (typeof amount === 'string') {
    // Agresif remove semua karakter non-numeric INCLUDING "Rp"
    const cleaned = amount.replace(/[^0-9]/g, '');
    numAmount = parseFloat(cleaned);
  } else {
    numAmount = amount;
  }
  
  if (!numAmount || isNaN(numAmount) || numAmount <= 0) return undefined;
  return 'Rp ' + numAmount.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

// Helper: Extract store name from supplier line (remove address, keywords)
function extractStoreName(line: string): string {
  // Remove common address patterns and keywords
  let cleaned = line
    // Remove "Toko" prefix
    .replace(/^(toko|store|supplier|cv|pt|ud|distributor)[:\s]*/gi, '')
    // Remove address patterns with numbers (Ruko, No., Jl., dll)
    .replace(/(ruko|perumahan|jl\.?|jalan|no\.?|rt\.?|rw\.?|kel\.?|kec\.?)\s+[^\s]*/gi, '')
    // Remove standalone numbers that look like addresses
    .replace(/\s+(no\.?\s*[a-z]?\d+|b\d+|blok\s+[a-z]\d*)/gi, '')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  // If result is too long (likely still has address), take only first part before common separators
  if (cleaned.length > 30) {
    // Split by common separators and take last meaningful part (usually store name)
    const parts = cleaned.split(/[,\.\-]/);
    // Get the last non-empty part which is usually the store name
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i].trim();
      if (part.length >= 5 && part.length <= 30) {
        cleaned = part;
        break;
      }
    }
  }
  
  return cleaned || line;
}

// Helper: Sanitize untuk remove double "Rp Rp" jika ada
function sanitizeRupiah(value: string | undefined): string | undefined {
  if (!value) return undefined;
  // Remove all "Rp" first, then add back only one
  const cleanValue = value.replace(/Rp/gi, '').trim();
  const numericOnly = cleanValue.replace(/[^0-9]/g, '');
  const num = parseFloat(numericOnly);
  if (!num || isNaN(num) || num <= 0) return undefined;
  return 'Rp ' + num.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

// Helper: Check if text contains coffee shop keywords with scoring
function containsCoffeeShopKeyword(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  // Prioritas tinggi untuk keyword yang match
  return keywords.some(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    // Exact match atau contains
    return lowerText === lowerKeyword || lowerText.includes(lowerKeyword);
  });
}

// Helper: Calculate relevance score for coffee shop items (higher = more relevant)
function getCoffeeShopRelevanceScore(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  let score = 0;
  
  keywords.forEach(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    if (lowerText === lowerKeyword) {
      score += 10; // Exact match
    } else if (lowerText.includes(lowerKeyword)) {
      score += 5; // Contains keyword
    }
  });
  
  return score;
}

// Helper: Clean item name (remove extra spaces, symbols, numbers, prices)
function cleanItemName(name: string): string {
  return name
    .replace(/Rp[\s]?[\d.,]+/gi, '') // Remove Rp dengan angka
    .replace(/[\d.,]+/g, '') // Remove semua angka
    .replace(/[@=]/g, '') // Remove simbol @ dan =
    .replace(/[:\-_]/g, ' ') // Replace separator dengan spasi
    .replace(/\s+/g, ' ') // Normalize spasi
    .trim();
}

// Helper: Normalize satuan to standard units
function normalizeSatuan(satuan: string): string {
  if (!satuan) return 'pcs';
  
  const lower = satuan.toLowerCase();
  
  // Weight
  if (lower.includes('kg') || lower === 'kilo') return 'kg';
  if (lower.includes('gr') || lower === 'gram') return 'gram';
  if (lower.includes('ton')) return 'ton';
  
  // Volume
  if (lower.includes('l') || lower === 'liter' || lower === 'litre') return 'liter';
  if (lower.includes('ml') || lower === 'mili') return 'ml';
  if (lower.includes('gal')) return 'gallon';
  
  // Count
  if (lower.includes('pcs') || lower === 'buah' || lower === 'biji') return 'pcs';
  if (lower.includes('pack') || lower === 'pak') return 'pack';
  if (lower.includes('box') || lower === 'kotak') return 'box';
  if (lower.includes('dus')) return 'dus';
  if (lower.includes('karton')) return 'karton';
  if (lower.includes('botol') || lower === 'btl') return 'botol';
  if (lower.includes('cup') || lower === 'gelas') return 'cup';
  
  // Default to pcs if unrecognized
  return 'pcs';
}

// Helper: Categorize item based on name
function categorizeItem(name: string): string {
  const lower = name.toLowerCase();
  
  // Bahan Baku
  const bahanBaku = [
    'kopi', 'coffee', 'arabica', 'robusta', 'espresso',
    'susu', 'milk', 'cream', 'creamer',
    'gula', 'sugar', 'madu', 'honey',
    'teh', 'tea', 'matcha', 'coklat', 'chocolate',
    'sirup', 'syrup', 'vanilla', 'caramel', 'hazelnut',
    'milo', 'ovaltine', 'bubuk', 'powder',
    'air', 'water', 'aqua', 'mineral'
  ];
  
  // Kemasan
  const kemasan = [
    'cup', 'gelas', 'paper cup', 'plastic cup',
    'sedotan', 'straw', 'lid', 'tutup',
    'box', 'paper bag', 'plastik', 'plastic',
    'tissue', 'serbet', 'napkin', 'wrapper'
  ];
  
  for (const keyword of bahanBaku) {
    if (lower.includes(keyword)) return 'Bahan Baku';
  }
  
  for (const keyword of kemasan) {
    if (lower.includes(keyword)) return 'Kemasan';
  }
  
  return 'Lainnya';
}
