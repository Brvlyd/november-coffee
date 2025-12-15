# Setup OCR untuk November Coffee

## 🚀 Instalasi - SUPER MUDAH!

### 1. Setup Environment Variables
Buat file `.env.local` di root project (jika belum ada):

```bash
# Supabase (sudah ada)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OCR.space (FREE!)
OCR_SPACE_API_KEY=K81729156788957
```

**PENTING:** 
- File `.env.local` jangan di-commit ke Git (sudah di `.gitignore`)
- API key sudah tersedia: **K81729156788957**
- OCR.space FREE tier: 25,000 requests/month!

### 2. Restart Development Server
Setelah menambah environment variable, restart server:
```powershell
# Stop server (Ctrl+C)
# Jalankan lagi
npm run dev
```

**ITU AJA!** Tidak perlu install package tambahan! ✨

## 📝 Cara Menggunakan

### Di Halaman Input Barang (Barang Masuk):

1. **Upload foto nota:**
   - Klik area upload, atau
   - Drag & drop file ke area upload

2. **Klik "Proses Nota dengan AI":**
   - AI akan membaca nota
   - Ekstrak item, jumlah, satuan, kategori
   - Tampilkan hasil dalam tabel

3. **Review hasil AI:**
   - Cek data yang dibaca AI
   - Pastikan akurat

4. **Klik "Simpan ke Inventori":**
   - Semua item otomatis masuk ke database
   - Beres!

## 🎯 Tips untuk Hasil Optimal

### Format Nota yang Bagus:
- ✅ Foto jelas dan terang
- ✅ Teks terbaca dengan baik
- ✅ Tidak blur atau gelap
- ✅ Format nota: list item dengan harga/jumlah
- ✅ Resolusi cukup tinggi

### Contoh Struktur Nota yang Ideal:
```
TOKO SUMBER JAYA
Jl. Mawar No. 123
--------------------------
Kopi Arabica    2 kg    Rp 200.000
Susu UHT        10 liter Rp 150.000
Gula Pasir      5 kg    Rp 75.000
--------------------------
Total: Rp 425.000
```

## 🧠 Cara Kerja OCR

1. **Upload:** File dikirim ke API route `/api/inventori/process-nota`
2. **OCR.space:** File langsung dikirim ke OCR.space API
3. **Extract Text:** OCR.space baca semua text dari gambar
4. **Parse:** Backend parsing text menjadi structured data:
   - `nama_barang`: Nama item (dari pattern text)
   - `jumlah`: Quantity (angka yang ditemukan)
   - `satuan`: Unit (kg, liter, pack, dll)
   - `kategori`: Otomatis ditentukan dari keyword
     - Bahan Baku: kopi, susu, gula, teh, sirup, cream
     - Kemasan: cup, gelas, box, plastik, sedotan, tutup
     - Lainnya: selain itu
   - `supplier`: Baris pertama nota (biasanya nama toko)
   - `tanggal`: Pattern dd/mm/yyyy atau dd-mm-yyyy
   - `total`: Pattern "total" atau "jumlah" + angka
5. **Response:** Data JSON dikembalikan ke frontend
6. **Displa - GRATIS! 🎉

### OCR.space FREE Tier:
- **25,000 requests/month:** GRATIS
- **Max file size:** 1MB (cukup untuk nota)
- **Support:** JPG, PNG, PDF, GIF
- **Tidak perlu kartu kredit!**

### Estimasi Penggunaan:
- **1 nota = 1 request**
- **25,000 requests = 833 nota per hari!**
- **Untuk coffee shop:** Lebih dari cukup!

### Upgrade (jika perlu di masa depan):
- **Pro Plan:** $7.99/bulan → 100,000 requests + fitur tambahan
- **Tapi untuk skala kecil-menengah, FREE tier sudah sangat cukup!**
- Resize foto sebelum upload (max 2048px)
- Gunakan foto berkualitas cukup (tidak perlu 4K)
- OpenAI beri free credit $5 untuk user baru

## 🔧 Troubleshooting

### Error: "ICR_SPACE_API_KEY=K81729156788957` ada di `.env.local`
- Restart development server
- Cek file `.env.local` tidak ada typo

### Error: "Rate limit exceeded"
- Free tier limit: 25,000/bulan
- Tunggu sampai bulan berikutnya
- Atau upgrade ke Pro ($7.99/bulan untuk 100k requests)

### OCR tidak bisa baca nota:
- **Pastikan foto jelas dan terang**
- Ukuran file < 1MB (resize jika perlu)
- Format: JPG atau PNG
- Hindari blur atau shadow
- Coba foto dengan lighting lebih baik

### Item yang dibaca tidak akurat:
- OCR.space bagus tapi tidak sempurna
- Format nota yang terstruktur akan lebih baik:
  ```
  Nama Barang  Jumlah  Satuan
  Kopi Arabica   2     kg
  Susu UHT      10     liter
  ```
- Jika parsing gagal, data akan ditampilkan di `rawText` (cek console)
- Bisa manual edit hasil sebelum save
CR.space API: https://ocr.space/ocrapi
- OCR.space Dashboard: https://ocr.space/ocrapi/account (untuk monitoring usage)
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

## ✨ Keuntungan OCR.space vs OpenAI Vision

| Feature | OCR.space | OpenAI Vision |
|---------|-----------|---------------|
| **Harga** | GRATIS (25k/bulan) | $0.02-0.05 per nota |
| **Setup** | Sangat mudah | Perlu setup & billing |
| **Kecepatan** | Cepat (~2-3 detik) | Cukup cepat (~3-5 detik) |
| **Akurasi Text** | Sangat baik | Excellent |
| **Parsing** | Perlu logic manual | Bisa langsung structured |
| **Best For** | Budget-friendly, volume tinggi | Akurasi maksimal |

**Kesimpulan:** Untuk coffee shop November Coffee, **OCR.space adalah pilihan terbaik** karena:
- ✅ Gratis
- ✅ Cukup akurat untuk nota standar  
- ✅ Mudah di-setup
- ✅ Limit 25k/bulan sangat cukup
- Cek console untuk `rawText`
- Format nota mungkin tidak standar
- Solusi: Manual input atau improve parsing logic di backendrbaca
- Manual edit jika perlu

## 📁 File-file Terkait

- **Frontend:** `app/admin/inventori/input-barang/page.tsx`
- **API Route:** `app/api/inventori/process-nota/route.ts`
- **Environment:** `.env.local`

## 🎓 Dokumentasi

- OpenAI API: https://platform.openai.com/docs
- GPT-4 Vision: https://platform.openai.com/docs/guides/vision
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
