# Instruksi Migration: Menambahkan Kode Barang Otomatis

## Deskripsi
Migration ini menambahkan kolom `kode_barang` ke tabel `inventori` dengan format BRG0001, BRG0002, dst. dan otomatis mengisi kode untuk semua barang yang sudah ada.

## Langkah-langkah

### 1. Login ke Supabase Dashboard
- Buka [https://supabase.com](https://supabase.com)
- Login dan pilih project Anda

### 2. Jalankan SQL Migration

1. Buka **SQL Editor** di sidebar kiri
2. Klik **New query** atau buat query baru
3. Copy dan paste isi file `migration_add_kode_barang.sql`
4. Klik **Run** untuk menjalankan query

### 3. Apa yang Dilakukan Migration

Migration ini akan:
- ✅ Menambahkan kolom `kode_barang` (VARCHAR 8, UNIQUE)
- ✅ **Auto-generate kode untuk semua barang yang sudah ada** berdasarkan urutan created_at
  - Barang pertama → BRG0001
  - Barang kedua → BRG0002
  - Dan seterusnya...
- ✅ Set kolom sebagai NOT NULL
- ✅ Membuat index untuk performa query
- ✅ Barang baru akan otomatis dapat kode berikutnya

### 4. Verifikasi Migration

Setelah migration berhasil, verifikasi dengan query berikut:

```sql
-- Cek apakah kolom kode_barang sudah ada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'inventori' 
AND column_name = 'kode_barang';

-- Cek semua barang dengan kode-nya
SELECT kode_barang, nama_barang, kategori, jumlah 
FROM inventori 
ORDER BY kode_barang ASC;

-- Hitung total barang yang sudah punya kode
SELECT COUNT(*) as total_barang_dengan_kode
FROM inventori 
WHERE kode_barang IS NOT NULL;
```

### 5. Testing

1. Buka halaman **Monitoring Stok** di aplikasi
2. Kolom **KODE** sekarang muncul di tabel
3. Semua barang sudah memiliki kode BRG0001, BRG0002, dst.
4. Tambah barang baru → akan otomatis dapat kode berikutnya

## Format Kode Barang

```
BRG0001
BRG0002
...
BRG9999
```

- **BRG** = Prefix tetap (BARANG)
- **0001** = 4 digit nomor urut (auto increment)

## Rollback (jika diperlukan)

Jika perlu membatalkan perubahan:

```sql
ALTER TABLE inventori DROP COLUMN IF EXISTS kode_barang;
DROP INDEX IF EXISTS idx_inventori_kode_barang;
```

## Catatan Penting
- ⚠️ Kolom ini UNIQUE - tidak boleh ada kode duplikat
- ⚠️ Kolom ini NOT NULL - semua barang HARUS punya kode
- ✅ Kode otomatis di-generate saat input barang baru
- ✅ Urutan kode berdasarkan urutan barang dibuat (created_at)
