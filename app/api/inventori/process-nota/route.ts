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

    // Prepare FormData for OCR.space API dengan optimasi untuk nota Indonesia
    const ocrFormData = new FormData();
    ocrFormData.append('file', file);
    ocrFormData.append('language', 'eng'); // English untuk deteksi angka dan teks campuran
    ocrFormData.append('isOverlayRequired', 'false');
    ocrFormData.append('detectOrientation', 'true');
    ocrFormData.append('scale', 'true');
    ocrFormData.append('OCREngine', '2'); // Engine 2 is better for complex images
    ocrFormData.append('isTable', 'true'); // Enable table detection for structured receipts
    ocrFormData.append('filetype', 'Auto'); // Auto-detect file type
    ocrFormData.append('detectCheckbox', 'false'); // Speed up processing

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

  // Extract supplier dengan prioritas multi-level
  const supplierKeywords = ['toko', 'store', 'supplier', 'cv', 'pt', 'ud', 'distributor', 'warung', 'swalayan'];
  
  // LEVEL 1: Cari line yang punya kata kunci supplier (prioritas tertinggi)
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Cek apakah ada keyword supplier
    if (supplierKeywords.some(kw => lowerLine.includes(kw))) {
      const extracted = extractStoreName(line);
      // Validasi: harus ada huruf dan panjang wajar
      if (extracted && extracted.length >= 3 && extracted.length <= 60 && /[a-zA-Z]{3,}/.test(extracted)) {
        supplier = extracted;
        break;
      }
    }
  }
  
  // LEVEL 2: Jika belum ketemu, ambil baris pertama yang substantial
  if (!supplier) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      // Skip jika jelas bukan nama toko
      if (line.length < 3 || line.length > 60 ||
          /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(line) ||
          /^(nota|invoice|receipt|tanggal|date|no\.)/i.test(line) ||
          /total|jumlah|bayar|tunai/i.test(line) ||
          /^\d+$/.test(line)) {
        continue;
      }
      
      // Harus mengandung huruf yang cukup
      if (/[a-zA-Z]{3,}/.test(line)) {
        supplier = extractStoreName(line);
        if (supplier && supplier.length >= 3) break;
      }
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

  // Daftar lengkap item coffee shop dengan prioritas dan kategori
  const coffeeShopItems = [
    // PRIORITAS SANGAT TINGGI - Item umum yang sering muncul
    'kopi', 'coffee', 'susu', 'milk', 'gula', 'sugar', 'teh', 'tea',
    'cup', 'gelas', 'aqua', 'air',
    
    // Kopi & Turunannya
    'arabica', 'robusta', 'liberica', 'excelsa', 'espresso', 'cappuccino',
    'americano', 'macchiato', 'latte', 'mocha', 'frappe', 'lungo',
    'biji kopi', 'kopi bubuk', 'kopi instan', 'green bean', 'roasted bean',
    'kopi sangrai', 'kopi hijau',
    
    // Susu & Produk Dairy
    'uht', 'fresh milk', 'full cream', 'low fat', 'skim milk',
    'cream', 'creamer', 'krimer', 'krim', 'whipping cream', 'heavy cream',
    'condensed milk', 'susu kental', 'evaporated', 'susu cair', 'susu bubuk',
    'dairy', 'susu segar', 'susu pasteurisasi',
    
    // Gula & Pemanis
    'gula pasir', 'gula merah', 'gula aren', 'brown sugar', 'white sugar',
    'palm sugar', 'raw sugar', 'cane sugar', 'madu', 'honey', 'stevia',
    'sweetener', 'gula jawa', 'gula batu',
    
    // Teh & Varian
    'matcha', 'green tea', 'teh hijau', 'black tea', 'teh hitam',
    'earl grey', 'chamomile', 'jasmine', 'melati', 'oolong', 'hojicha',
    'teh celup', 'tea bag', 'teh tubruk', 'teh manis',
    
    // Sirup & Flavor
    'sirup', 'syrup', 'vanilla', 'vanila', 'caramel', 'karamel',
    'hazelnut', 'chocolate', 'coklat', 'strawberry', 'stroberi',
    'sauce', 'saus', 'palm', 'monin', 'torani', 'peppermint',
    'irish cream', 'butterscotch',
    
    // Powder & Bubuk
    'milo', 'ovaltine', 'bubuk', 'powder', 'chocolate powder',
    'cocoa', 'cokelat bubuk', 'choco', 'oreo', 'tiramisu',
    'red velvet', 'taro', 'matcha powder', 'chai',
    
    // Kemasan
    'paper cup', 'plastic cup', 'hot cup', 'cold cup', 'foam cup',
    'sedotan', 'straw', 'paper straw', 'plastic straw', 'bamboo straw',
    'lid', 'tutup', 'dome lid', 'flat lid', 'sippy lid',
    'box', 'paper bag', 'kantong', 'plastik', 'plastic bag',
    'tissue', 'tisu', 'serbet', 'napkin', 'wrapper', 'packaging',
    'sleeve', 'holder', 'carrier', 'cup holder',
    
    // Air & Minuman Lain
    'air mineral', 'mineral water', 'aqua', 'ades', 'vit', 'le minerale',
    'air minum', 'drinking water', 'sparkling', 'soda', 'sprite', 'coca cola', 'fanta',
    
    // Topping & Extras
    'whipped cream', 'whip cream', 'ice cream', 'es krim', 'topping',
    'jelly', 'pudding', 'boba', 'bubble', 'pearl', 'tapioca',
    'cincau', 'grass jelly', 'nata de coco', 'almond', 'wafer', 'cookie', 'biskuit',
    'biscuit', 'marshmallow', 'sprinkles', 'meses', 'choco chips',
    
    // Brand-brand populer di Indonesia (untuk deteksi lebih akurat)
    'indomilk', 'ultra', 'frisian flag', 'greenfields', 'diamond',
    'abc', 'santos', 'kapal api', 'good day', 'nescafe', 'torabika',
    'tropicana', 'minute maid', 'nestle', 'dancow'
  ];

  // Helper function to extract all numbers from a line - CLEAN numbers only
  const extractNumbers = (line: string): number[] => {
    // Match angka dengan atau tanpa Rp, titik ribuan, atau koma
    const matches = line.match(/(?:Rp[\s.]?)?([\d]{1,3}(?:[.,][\d]{3})*(?:[.,][\d]+)?)/gi);
    if (!matches) return [];
    
    const extractedNumbers: number[] = [];
    
    for (const m of matches) {
      // AGRESIF: Bersihkan SEMUA karakter non-numeric kecuali digit
      const cleaned = m.replace(/[^0-9]/g, '');
      const num = parseFloat(cleaned);
      
      if (isNaN(num) || num <= 0) continue;
      
      // DETEKSI angka gabungan: jika angka 5+ digit dan bisa dipecah jadi qty + harga
      // Contoh: 12001 -> 2 dan 12000 atau 212000 -> 2 dan 12000
      if (cleaned.length >= 5) {
        // Coba pisahkan: 1-2 digit pertama sebagai qty, sisanya sebagai harga
        for (let qtyLen = 1; qtyLen <= 2; qtyLen++) {
          const potentialQty = parseInt(cleaned.substring(0, qtyLen));
          const potentialPrice = parseInt(cleaned.substring(qtyLen));
          
          // Validasi: qty harus < 50 dan harga harus >= 1000 (harga wajar)
          // Dan hasil perkalian harus masuk akal
          if (potentialQty > 0 && potentialQty < 50 && 
              potentialPrice >= 1000 && potentialPrice < 1000000) {
            // Cek apakah ini likely gabungan: harga habis dibagi 1000 (kelipatan ribuan)
            if (potentialPrice % 1000 === 0 || potentialPrice % 100 === 0) {
              // Ini kemungkinan besar angka gabungan!
              extractedNumbers.push(potentialQty);
              extractedNumbers.push(potentialPrice);
              // Jangan push angka asli, sudah dipecah
              continue;
            }
          }
        }
      }
      
      // Jika tidak terdeteksi sebagai gabungan, push as-is
      extractedNumbers.push(num);
    }
    
    return extractedNumbers.filter(n => !isNaN(n) && n > 0);
  };

  // Helper untuk klasifikasi angka dengan logika yang lebih cerdas
  const classifyNumbers = (numbers: number[], satuan?: string, line?: string) => {
    if (numbers.length === 0) return {};
    
    // Sort dari kecil ke besar
    const sorted = [...numbers].sort((a, b) => a - b);
    
    // Single number logic
    if (numbers.length === 1) {
      const num = numbers[0];
      // Jika < 100, kemungkinan besar quantity
      if (num < 100) return { jumlah: num };
      // Jika 100-1000, bisa jadi qty atau harga satuan - default qty
      if (num < 1000) return { jumlah: num };
      // Jika >= 1000, kemungkinan harga total
      return { harga_total: num };
    }
    
    // Two numbers - ini yang paling tricky
    if (numbers.length === 2) {
      const small = sorted[0];
      const large = sorted[1];
      const ratio = large / small;
      
      // PRIORITAS 1: Angka kecil jelas qty (1-99) dan besar jelas harga (>= 5000)
      if (small >= 1 && small <= 99 && large >= 5000) {
        return { jumlah: small, harga_total: large };
      }
      
      // PRIORITAS 2: Ratio sangat besar (>= 500) - pasti qty x total
      if (ratio >= 500) {
        return { jumlah: small, harga_total: large };
      }
      
      // PRIORITAS 3: Small reasonable qty (1-50) dan large reasonable price (>= 2000)
      if (small >= 1 && small <= 50 && large >= 2000) {
        return { jumlah: small, harga_total: large };
      }
      
      // PRIORITAS 4: Cek apakah bisa dibagi dengan baik
      // Jika large / small menghasilkan angka bulat ribuan, kemungkinan qty x total
      if (small <= 100 && large % small === 0) {
        const calculatedPrice = large / small;
        // Harga per unit harus wajar (>= 500)
        if (calculatedPrice >= 500) {
          return { 
            jumlah: small, 
            harga_satuan: calculatedPrice,
            harga_total: large 
          };
        }
      }
      
      // PRIORITAS 5: Small < 100 dan large dalam range harga wajar
      if (small < 100 && large >= 1000 && large <= 10000000) {
        return { jumlah: small, harga_total: large };
      }
      
      // PRIORITAS 6: Keduanya kecil - likely qty dan harga satuan
      if (small < 100 && large < 10000) {
        return { jumlah: small, harga_satuan: large };
      }
      
      // FALLBACK: Default assignment dengan warning jika suspicious
      if (small > 1000) {
        console.warn(`⚠️ Suspicious number classification: ${small} vs ${large}`);
      }
      return { jumlah: small, harga_total: large };
    }
    
    if (numbers.length >= 3) {
      // Three+ numbers: terkecil = jumlah, menengah = harga satuan, terbesar = harga total
      const potentialQty = sorted[0];
      const potentialUnitPrice = sorted[1];
      const potentialTotal = sorted[sorted.length - 1]; // ambil yang terbesar
      
      // VALIDASI KETAT:
      // 1. Jumlah harus masuk akal (< 500 untuk quantity)
      // 2. Harga satuan < harga total
      // 3. Ratio total/qty harus sekitar harga satuan (validasi konsistensi)
      const isQtyValid = potentialQty < 500;
      const isPriceValid = potentialUnitPrice < potentialTotal;
      const calculatedUnitPrice = potentialTotal / potentialQty;
      const isConsistent = Math.abs(calculatedUnitPrice - potentialUnitPrice) / calculatedUnitPrice < 0.5; // Toleransi 50%
      
      if (isQtyValid && isPriceValid && (isConsistent || potentialUnitPrice * potentialQty === potentialTotal)) {
        return { 
          jumlah: potentialQty, 
          harga_satuan: potentialUnitPrice,
          harga_total: potentialTotal 
        };
      }
      
      // Fallback: coba tanpa middle number
      if (isQtyValid && potentialTotal / potentialQty >= 1000) {
        const calculatedPrice = Math.round(potentialTotal / potentialQty);
        return {
          jumlah: potentialQty,
          harga_satuan: calculatedPrice,
          harga_total: potentialTotal
        };
      }
      
      // Last resort: ambil 3 angka pertama setelah di-sort
      return { 
        jumlah: sorted[0], 
        harga_satuan: sorted[1],
        harga_total: sorted[2] 
      };
    }
    
    return { jumlah: sorted[0] };
  };

  // Helper: Validasi apakah line adalah item yang valid
  const isValidItemLine = (line: string): boolean => {
    const lower = line.toLowerCase();
    
    // Skip jika sama dengan supplier
    if (line === supplier) return false;
    
    // Skip jika terlalu pendek (< 2 chars)
    if (line.length < 2) return false;
    
    // Skip jika hanya angka
    if (/^\d+$/.test(line)) return false;
    
    // Skip keywords yang jelas bukan item
    const skipKeywords = [
      'total', 'subtotal', 'grand total', 'jumlah', 'amount',
      'terima kasih', 'thank you', 'thanks', 'terimakasih',
      'pembayaran', 'payment', 'bayar', 'paid',
      'kembalian', 'change', 'kembali',
      'tunai', 'cash', 'debit', 'credit', 'transfer',
      'tanggal', 'date', 'tgl',
      'nota', 'invoice', 'receipt', 'bill', 'struk',
      'no.', 'number', 'nomor',
      'kasir', 'cashier', 'operator',
      'alamat', 'address', 'telp', 'phone', 'hp',
      'website', 'email', 'instagram', 'facebook'
    ];
    
    for (const keyword of skipKeywords) {
      if (lower.includes(keyword)) return false;
    }
    
    // Skip jika ada pattern tanggal
    if (/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(line)) return false;
    
    // Skip jika ada pattern waktu (HH:MM atau HH.MM)
    if (/\d{1,2}[:.]\d{2}/.test(line) && !/\d{3,}/.test(line)) return false;
    
    return true;
  };

  // Parse items dengan multiple pattern dan validasi ketat
  for (const line of lines) {
    // Validasi awal
    if (!isValidItemLine(line)) continue;

    let parsed = false;

    // PRE-PROCESS: Remove ALL "Rp" dari line untuk prevent double Rp
    const cleanLine = line.replace(/Rp/gi, '').trim();

    // Extract all numbers first dari clean line
    const numbers = extractNumbers(cleanLine);
    
    // Calculate coffee shop relevance score
    const relevanceScore = getCoffeeShopRelevanceScore(cleanLine, coffeeShopItems);
    const isCoffeeShopItem = relevanceScore > 0;

    // Pattern 1: "Nama Barang jumlah satuan harga" - Extract nama sebelum angka pertama
    // Contoh: "Kopi Arabica 2 Kg 50000" atau "Susu UHT 10 liter 150000"
    const pattern1 = /^([a-zA-Z][a-zA-Z\s]+?)\s+(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)/i;
    const match1 = cleanLine.match(pattern1);
    if (match1 && !parsed) {
      const [, nama, jumlahStr, satuan] = match1;
      const jumlahValue = parseFloat(jumlahStr.replace(/[.,]/g, ''));
      
      // VALIDASI KETAT:
      // 1. Nama harus >= 2 chars dan punya huruf yang cukup
      // 2. jumlahValue harus reasonable untuk quantity (< 1000 atau volume unit)
      // 3. Harus coffee shop item ATAU punya angka valid untuk harga
      const hasEnoughLetters = /[a-zA-Z]{2,}/.test(nama);
      const isVolumeUnit = ['ml', 'gram', 'gr', 'cc'].some(u => satuan.toLowerCase().includes(u));
      const isReasonableQty = jumlahValue < 1000 || (isVolumeUnit && jumlahValue <= 10000);
      
      if (hasEnoughLetters && isReasonableQty && 
          (isCoffeeShopItem || (numbers.length > 0 && nama.length >= 2))) {
        // Filter out jumlahValue from numbers before classifying prices
        const filteredNumbers = numbers.filter(n => n !== jumlahValue);
        const classified = classifyNumbers(filteredNumbers, satuan, line);
        
        // Clean nama dari semua angka dan symbol - murni nama barang aja
        const cleanedName = nama.trim();
        
        // Gunakan jumlahValue dari regex sebagai jumlah utama
        const finalJumlah = jumlahValue;
        let hargaSatuan = classified.harga_satuan;
        
        // PRIORITAS: Hitung harga satuan dari total/qty (lebih akurat)
        if (finalJumlah && classified.harga_total && finalJumlah > 0) {
          const calculatedPrice = Math.round(classified.harga_total / finalJumlah);
          // Gunakan calculated price jika masuk akal (> 100 dan berbeda signifikan dari classified)
          if (calculatedPrice >= 100 && (!hargaSatuan || Math.abs(calculatedPrice - hargaSatuan) > 1000)) {
            hargaSatuan = calculatedPrice;
          } else if (!hargaSatuan) {
            hargaSatuan = calculatedPrice;
          }
        }
        
        // Allow 2+ chars untuk item pendek seperti "tea"
        if (cleanedName.length >= 2) {
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
    // Quantity di awal, diikuti unit, lalu nama produk
    if (!parsed) {
      const pattern2 = /^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)\s+([a-zA-Z].+)/i;
      const match2 = cleanLine.match(pattern2);
      if (match2) {
        const [, jumlahStr, satuan, nama] = match2;
        const jumlahValue = parseFloat(jumlahStr.replace(/[.,]/g, ''));
        
        // VALIDASI:
        // 1. Nama harus punya huruf yang cukup (minimal 2 chars kata)
        // 2. Quantity harus reasonable
        // 3. Unit harus valid
        const hasValidName = nama.length >= 2 && /[a-zA-Z]{2,}/.test(nama);
        const isValidUnit = /^(kg|gram|gr|liter|ml|pcs|pack|box|dus|botol|cup)$/i.test(satuan);
        
        if (hasValidName && isValidUnit) {
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
          
          // PRIORITAS: Hitung harga satuan dari total/qty (lebih akurat)
          if (finalJumlah && classified.harga_total && finalJumlah > 0) {
            const calculatedPrice = Math.round(classified.harga_total / finalJumlah);
            if (calculatedPrice >= 100 && (!hargaSatuan || Math.abs(calculatedPrice - hargaSatuan) > 1000)) {
              hargaSatuan = calculatedPrice;
            } else if (!hargaSatuan) {
              hargaSatuan = calculatedPrice;
            }
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
    // Nama produk dengan separator, lalu quantity dan unit
    if (!parsed) {
      const pattern3 = /^([a-zA-Z][a-zA-Z\s]+?)[\s:-]+(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)/i;
      const match3 = cleanLine.match(pattern3);
      if (match3) {
        const [, nama, jumlahStr, satuan] = match3;
        const jumlahValue = parseFloat(jumlahStr.replace(/[.,]/g, ''));
        
        // VALIDASI KETAT:
        // 1. Nama harus valid dengan huruf yang cukup
        // 2. Quantity harus reasonable berdasarkan unit
        // 3. Unit harus recognized
        const hasValidName = nama.length >= 2 && /[a-zA-Z]{2,}/.test(nama);
        const isVolumeUnit = ['ml', 'gram', 'gr', 'cc'].some(u => satuan.toLowerCase().includes(u));
        const isValidJumlah = jumlahValue < 1000 || (isVolumeUnit && jumlahValue <= 10000);
        const isValidUnit = /^(kg|gram|gr|liter|ml|pcs|pack|box|dus|botol|cup|cc)$/i.test(satuan);
        
        if (hasValidName && isValidJumlah && isValidUnit) {
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
          
          // PRIORITAS: Hitung harga satuan dari total/qty (lebih akurat)
          if (finalJumlah && classified.harga_total && finalJumlah > 0) {
            const calculatedPrice = Math.round(classified.harga_total / finalJumlah);
            if (calculatedPrice >= 100 && (!hargaSatuan || Math.abs(calculatedPrice - hargaSatuan) > 1000)) {
              hargaSatuan = calculatedPrice;
            } else if (!hargaSatuan) {
              hargaSatuan = calculatedPrice;
            }
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

    // Pattern 4: "Nama Item 100 50.000" - nama di awal, diikuti angka-angka
    // Fallback pattern untuk format yang lebih bebas
    if (!parsed) {
      const pattern4 = /^([a-zA-Z][a-zA-Z\s]+?)\s+(\d+)/i;
      const match4 = cleanLine.match(pattern4);
      if (match4 && numbers.length > 0) {
        const nama = match4[1].trim();
        
        // VALIDASI: Nama harus valid dan ada coffee shop relevance atau angka yang cukup
        const hasValidName = nama.length >= 2 && /[a-zA-Z]{2,}/.test(nama);
        const hasPriceNumbers = numbers.some(n => n >= 1000); // Ada angka yang seperti harga
        
        if (hasValidName && (isCoffeeShopItem || hasPriceNumbers)) {
          const classified = classifyNumbers(numbers, undefined, line);
          
          // PRIORITAS: Hitung harga satuan dari total/qty (lebih akurat)
          let hargaSatuan = classified.harga_satuan;
          if (classified.jumlah && classified.harga_total && classified.jumlah > 0) {
            const calculatedPrice = Math.round(classified.harga_total / classified.jumlah);
            if (calculatedPrice >= 100 && (!hargaSatuan || Math.abs(calculatedPrice - hargaSatuan) > 1000)) {
              hargaSatuan = calculatedPrice;
            } else if (!hargaSatuan) {
              hargaSatuan = calculatedPrice;
            }
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
      if (nama.length >= 2 && !nama.toLowerCase().includes('total') && 
          !nama.toLowerCase().includes('jumlah')) {
        const classified = classifyNumbers(numbers, undefined, line);
        
        // PRIORITAS: Hitung harga satuan dari total/qty (lebih akurat)
        let hargaSatuan = classified.harga_satuan;
        if (classified.jumlah && classified.harga_total && classified.jumlah > 0) {
          const calculatedPrice = Math.round(classified.harga_total / classified.jumlah);
          if (calculatedPrice >= 100 && (!hargaSatuan || Math.abs(calculatedPrice - hargaSatuan) > 1000)) {
            hargaSatuan = calculatedPrice;
          } else if (!hargaSatuan) {
            hargaSatuan = calculatedPrice;
          }
        }
        
        items.push({
          nama_barang: cleanItemName(nama),
          jumlah: classified.jumlah || 1,
          satuan: 'pcs',
          kategori: categorizeItem(nama),
          harga_satuan: typeof hargaSatuan === 'number' ? hargaSatuan : undefined,
          harga_total: typeof classified.harga_total === 'number' ? classified.harga_total : undefined,
          relevance: relevanceScore, // Track relevance for debugging
        });
      }
    }
  }

  // VALIDASI FINAL: Cek consistency antara jumlah, harga satuan, dan total
  const validatedItems = items.map(item => {
    let { jumlah, harga_satuan, harga_total } = item;
    
    // Jika ada jumlah dan total, tapi harga satuan salah atau tidak ada
    if (jumlah && harga_total && jumlah > 0) {
      const calculatedSatuan = Math.round(harga_total / jumlah);
      
      // Jika harga satuan tidak ada, hitung dari total/jumlah
      if (!harga_satuan) {
        harga_satuan = calculatedSatuan;
      } 
      // Jika harga satuan ada tapi tidak konsisten (selisih > 20%), gunakan calculated
      else if (harga_satuan > 0) {
        const diff = Math.abs(harga_satuan - calculatedSatuan) / calculatedSatuan;
        if (diff > 0.2) { // Toleransi 20%
          console.warn(`Inconsistent price detected for ${item.nama_barang}: satuan=${harga_satuan}, calculated=${calculatedSatuan}`);
          harga_satuan = calculatedSatuan;
        }
      }
      
      // VALIDASI SWAP: Jika jumlah > 1000, kemungkinan tertukar dengan harga
      if (jumlah > 1000 && harga_satuan && harga_satuan < 100) {
        console.warn(`Possible swap detected for ${item.nama_barang}: qty=${jumlah}, price=${harga_satuan}`);
        // Tukar
        [jumlah, harga_satuan] = [harga_satuan, jumlah];
        harga_total = jumlah * harga_satuan;
      }
    }
    
    return { ...item, jumlah, harga_satuan, harga_total };
  });

  // Format semua harga ke format rupiah - dengan FINAL sanitization
  const formattedItems = validatedItems.map(item => {
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
  // PRIORITAS UTAMA: Extract nama setelah "Toko" dengan berbagai format
  // Format: "Toko ...Indah Abadi..." atau "Toko: Nama" atau "Toko Nama"
  const tokoPatterns = [
    /toko[:\s]*\.+\s*([a-zA-Z\s]+?)(?:\.|$|[\r\n])/i,  // "Toko ...Nama..."
    /toko[:\s]+([a-zA-Z\s]+?)(?:\s+no\.?|\s+jl\.?|\s+ruko|$|[\r\n])/i,  // "Toko Nama No./Jl./..."
    /toko[:\s]+([a-zA-Z\s]+)/i  // "Toko Nama" (fallback)
  ];
  
  for (const pattern of tokoPatterns) {
    const match = line.match(pattern);
    if (match && match[1]) {
      let storeName = match[1]
        .trim()
        .replace(/\.+/g, '') // Remove dots
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      // Filter out noise: angka, tanggal, alamat pendek
      if (storeName.length >= 3 && 
          storeName.length <= 50 && 
          !/^\d+$/.test(storeName) &&  // Not just numbers
          !(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(storeName))) {  // Not a date
        return storeName;
      }
    }
  }
  
  // FALLBACK: Remove common address patterns and keywords
  let cleaned = line
    // Remove "Toko" prefix
    .replace(/^(toko|store|supplier|cv|pt|ud|distributor)[:\s]*/gi, '')
    // Remove dots
    .replace(/\.+/g, ' ')
    // Remove address patterns with numbers (Ruko, No., Jl., dll)
    .replace(/(ruko|perumahan|jl\.?|jalan|no\.?|rt\.?|rw\.?|kel\.?|kec\.?)\s+[^\s]*/gi, '')
    // Remove standalone numbers that look like addresses
    .replace(/\s+(no\.?\s*[a-z]?\d+|b\d+|blok\s+[a-z]\d*)/gi, '')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  // If result is too long (likely still has address), take only first part before common separators
  if (cleaned.length > 30) {
    // Split by common separators and take first meaningful part
    const parts = cleaned.split(/[,\-]/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length >= 3 && trimmed.length <= 30 && !/^\d+$/.test(trimmed)) {
        cleaned = trimmed;
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

// Helper: Calculate relevance score dengan weighted scoring yang lebih akurat
function getCoffeeShopRelevanceScore(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  let score = 0;
  
  // Priority keywords (common items) - higher weight
  const priorityKeywords = ['kopi', 'coffee', 'susu', 'milk', 'gula', 'sugar', 'teh', 'tea', 'cup', 'aqua'];
  
  keywords.forEach(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    const isPriority = priorityKeywords.includes(lowerKeyword);
    
    if (lowerText === lowerKeyword) {
      // Exact match - highest score
      score += isPriority ? 20 : 10;
    } else if (lowerText.split(/\s+/).includes(lowerKeyword)) {
      // Word match (not just substring)
      score += isPriority ? 15 : 8;
    } else if (lowerText.includes(lowerKeyword) && lowerKeyword.length >= 4) {
      // Substring match (only for longer keywords to avoid false positives)
      score += isPriority ? 10 : 5;
    }
  });
  
  return score;
}

// Helper: Clean item name dengan pembersihan yang lebih cerdas
function cleanItemName(name: string): string {
  let cleaned = name;
  
  // 1. Remove price patterns (Rp + numbers)
  cleaned = cleaned.replace(/Rp[\s]?[\d.,]+/gi, '');
  
  // 2. Remove standalone large numbers (likely prices)
  cleaned = cleaned.replace(/\b\d{4,}\b/g, '');
  
  // 3. Keep small numbers that might be part of name (e.g., "Kopi 3in1")
  // But remove quantity numbers with units
  cleaned = cleaned.replace(/\b\d+\s*(kg|gram|gr|liter|ml|pcs|pack)\b/gi, '');
  
  // 4. Remove special symbols
  cleaned = cleaned.replace(/[@=]/g, '');
  
  // 5. Normalize separators to spaces
  cleaned = cleaned.replace(/[:\-_\/\\]/g, ' ');
  
  // 6. Remove extra dots and commas (but keep decimal points if needed)
  cleaned = cleaned.replace(/[.,]{2,}/g, '');
  
  // 7. Normalize multiple spaces to single space
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // 8. Trim and title case (capitalize first letter of each word)
  cleaned = cleaned.trim();
  cleaned = cleaned.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return cleaned;
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

// Helper: Kategorisasi item dengan prioritas yang lebih detail
function categorizeItem(name: string): string {
  const lower = name.toLowerCase();
  
  // Kategori Kopi (priority 1)
  const kopi = ['kopi', 'coffee', 'arabica', 'robusta', 'liberica', 'espresso', 
                'cappuccino', 'americano', 'latte', 'macchiato', 'mocha'];
  for (const keyword of kopi) {
    if (lower.includes(keyword)) return 'Kopi';
  }
  
  // Kategori Susu & Dairy (priority 2)
  const susu = ['susu', 'milk', 'cream', 'creamer', 'krim', 'krimer', 
                'uht', 'dairy', 'condensed', 'evaporated'];
  for (const keyword of susu) {
    if (lower.includes(keyword)) return 'Susu & Dairy';
  }
  
  // Kategori Teh (priority 3)
  const teh = ['teh', 'tea', 'matcha', 'earl grey', 'chamomile', 
               'jasmine', 'oolong', 'hojicha'];
  for (const keyword of teh) {
    if (lower.includes(keyword)) return 'Teh';
  }
  
  // Kategori Pemanis (priority 4)
  const pemanis = ['gula', 'sugar', 'madu', 'honey', 'stevia', 'sweetener'];
  for (const keyword of pemanis) {
    if (lower.includes(keyword)) return 'Pemanis';
  }
  
  // Kategori Sirup & Saus
  const sirup = ['sirup', 'syrup', 'vanilla', 'caramel', 'hazelnut', 
                 'sauce', 'saus', 'chocolate', 'coklat'];
  for (const keyword of sirup) {
    if (lower.includes(keyword)) return 'Sirup & Saus';
  }
  
  // Kategori Bubuk & Powder
  const bubuk = ['milo', 'ovaltine', 'bubuk', 'powder', 'cocoa', 'choco'];
  for (const keyword of bubuk) {
    if (lower.includes(keyword)) return 'Bubuk & Powder';
  }
  
  // Kategori Kemasan
  const kemasan = ['cup', 'gelas', 'paper cup', 'plastic cup',
                   'sedotan', 'straw', 'lid', 'tutup',
                   'box', 'paper bag', 'plastik', 'plastic',
                   'tissue', 'tisu', 'serbet', 'napkin', 'wrapper'];
  for (const keyword of kemasan) {
    if (lower.includes(keyword)) return 'Kemasan';
  }
  
  // Kategori Minuman Lain
  const minuman = ['air', 'water', 'aqua', 'mineral', 'soda', 'sprite', 
                   'coca', 'fanta', 'juice'];
  for (const keyword of minuman) {
    if (lower.includes(keyword)) return 'Minuman';
  }
  
  // Kategori Topping
  const topping = ['whipped', 'ice cream', 'topping', 'jelly', 'pudding',
                   'boba', 'pearl', 'cincau'];
  for (const keyword of topping) {
    if (lower.includes(keyword)) return 'Topping';
  }
  
  // Default
  return 'Bahan Baku';
}
