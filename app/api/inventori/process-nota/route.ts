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

  // Extract supplier (usually first few lines)
  if (lines.length > 0) {
    supplier = lines[0];
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
      total = `Rp ${totalMatch[2]}`;
      break;
    }
  }

  // Common coffee shop items untuk smart matching
  const coffeeShopItems = [
    'kopi', 'coffee', 'arabica', 'robusta', 'espresso', 'latte',
    'susu', 'milk', 'uht', 'fresh milk', 'cream', 'creamer',
    'gula', 'sugar', 'gula pasir', 'gula merah', 'brown sugar',
    'teh', 'tea', 'green tea', 'black tea',
    'sirup', 'syrup', 'vanilla', 'caramel', 'hazelnut', 'chocolate',
    'coklat', 'matcha', 'milo', 'ovaltine',
    'cup', 'gelas', 'paper cup', 'plastic cup',
    'sedotan', 'straw', 'lid', 'tutup',
    'box', 'paper bag', 'plastik', 'plastic',
    'tissue', 'serbet', 'napkin',
    'air mineral', 'aqua', 'mineral water'
  ];

  // Helper function to extract all numbers from a line
  const extractNumbers = (line: string): number[] => {
    const matches = line.match(/[Rp.\s]*([\d.,]+)/gi);
    if (!matches) return [];
    return matches.map(m => {
      const cleaned = m.replace(/[Rp.\s]/gi, '').replace(/,/g, '');
      return parseFloat(cleaned);
    }).filter(n => !isNaN(n));
  };

  // Helper to determine which number is quantity vs price
  const classifyNumbers = (numbers: number[], satuan?: string) => {
    if (numbers.length === 0) return {};
    if (numbers.length === 1) {
      // Single number: likely quantity if small, price if large
      return numbers[0] < 1000 ? { jumlah: numbers[0] } : { harga_total: numbers[0] };
    }
    
    // Multiple numbers: smallest is usually quantity
    const sorted = [...numbers].sort((a, b) => a - b);
    const jumlah = sorted[0];
    
    if (numbers.length === 2) {
      // Two numbers: quantity and total price
      return { jumlah: sorted[0], harga_total: sorted[1] };
    }
    
    if (numbers.length >= 3) {
      // Three+ numbers: quantity, unit price, total price
      return { 
        jumlah: sorted[0], 
        harga_satuan: sorted[1],
        harga_total: sorted[2] 
      };
    }
    
    return { jumlah };
  };

  // Parse items with multiple pattern attempts
  for (const line of lines) {
    // Skip supplier line, total line, and very short lines
    if (line === supplier || line.toLowerCase().includes('total') || 
        line.toLowerCase().includes('jumlah') || line.length < 3) {
      continue;
    }

    let parsed = false;

    // Extract all numbers first
    const numbers = extractNumbers(line);

    // Pattern 1: Full format with prices "Kopi Arabica 2 kg @ Rp 100.000 = Rp 200.000"
    const pattern1 = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)/i;
    const match1 = line.match(pattern1);
    if (match1) {
      const [, nama, , satuan] = match1;
      // Check if nama contains coffee shop keywords
      if (containsCoffeeShopKeyword(nama, coffeeShopItems)) {
        const classified = classifyNumbers(numbers, satuan);
        items.push({
          nama_barang: cleanItemName(nama),
          jumlah: classified.jumlah || 1,
          satuan: normalizeSatuan(satuan),
          kategori: categorizeItem(nama),
          harga_satuan: classified.harga_satuan,
          harga_total: classified.harga_total,
        });
        parsed = true;
      }
    }

    // Pattern 2: "10 Kg Kopi Rp 100.000" atau "2 liter Susu 50000"
    if (!parsed) {
      const pattern2 = /^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)\s+(.+)/i;
      const match2 = line.match(pattern2);
      if (match2) {
        const [, , satuan, nama] = match2;
        if (containsCoffeeShopKeyword(nama, coffeeShopItems)) {
          const classified = classifyNumbers(numbers, satuan);
          items.push({
            nama_barang: cleanItemName(nama),
            jumlah: classified.jumlah || 1,
            satuan: normalizeSatuan(satuan),
            kategori: categorizeItem(nama),
            harga_satuan: classified.harga_satuan,
            harga_total: classified.harga_total,
          });
          parsed = true;
        }
      }
    }

    // Pattern 3: "Kopi - 2kg 100000" atau "Susu : 10 liter Rp 150.000"
    if (!parsed) {
      const pattern3 = /^(.+?)[\s:-]+(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)/i;
      const match3 = line.match(pattern3);
      if (match3) {
        const [, nama, , satuan] = match3;
        if (containsCoffeeShopKeyword(nama, coffeeShopItems)) {
          const classified = classifyNumbers(numbers, satuan);
          items.push({
            nama_barang: cleanItemName(nama),
            jumlah: classified.jumlah || 1,
            satuan: normalizeSatuan(satuan),
            kategori: categorizeItem(nama),
            harga_satuan: classified.harga_satuan,
            harga_total: classified.harga_total,
          });
          parsed = true;
        }
      }
    }

    // Pattern 4: Hanya nama dengan angka "Cup 100 500 50000"
    if (!parsed) {
      if (numbers.length > 0 && containsCoffeeShopKeyword(line, coffeeShopItems)) {
        // Extract item name (remove all numbers and extra symbols)
        const nama = line.replace(/[\d.,Rp@=\s-]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (nama.length > 2) {
          const classified = classifyNumbers(numbers);
          items.push({
            nama_barang: cleanItemName(nama),
            jumlah: classified.jumlah || 1,
            satuan: 'pcs',
            kategori: categorizeItem(nama),
            harga_satuan: classified.harga_satuan,
            harga_total: classified.harga_total,
          });
        }
      }
    }
  }

  return {
    items,
    supplier: supplier || undefined,
    tanggal: tanggal || undefined,
    total: total || undefined,
  };
}

// Helper: Check if text contains coffee shop keywords
function containsCoffeeShopKeyword(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// Helper: Clean item name (remove extra spaces, symbols)
function cleanItemName(name: string): string {
  return name
    .replace(/[:\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper: Normalize satuan to standard units
function normalizeSatuan(satuan: string): string {
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
  
  return lower;
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
