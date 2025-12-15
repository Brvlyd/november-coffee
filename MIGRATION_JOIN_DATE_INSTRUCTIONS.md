# Instruksi Migration: Menambahkan Join Date Field

## Deskripsi
Migration ini menambahkan kolom `join_date` ke tabel `employees` untuk mencatat tanggal bergabung karyawan.

## Langkah-langkah

### 1. Login ke Supabase Dashboard
- Buka [https://supabase.com](https://supabase.com)
- Login dan pilih project Anda

### 2. Jalankan SQL Migration

1. Buka **SQL Editor** di sidebar kiri
2. Klik **New query** atau buat query baru
3. Copy dan paste isi file `migration_add_join_date.sql`
4. Klik **Run** untuk menjalankan query

### 3. Verifikasi Migration

Setelah migration berhasil, verifikasi dengan query berikut:

```sql
-- Cek apakah kolom join_date sudah ada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'join_date';

-- Cek data karyawan
SELECT id, full_name, created_at, join_date 
FROM employees 
LIMIT 5;
```

### 4. Testing

1. Buka aplikasi dan masuk ke detail karyawan
2. Klik **Edit Data**
3. Ubah **Tanggal Bergabung**
4. Klik **Simpan**
5. Pastikan data tersimpan dan "Lama Bekerja" terupdate

## Rollback (jika diperlukan)

Jika perlu membatalkan perubahan:

```sql
ALTER TABLE employees DROP COLUMN IF EXISTS join_date;
```

## Catatan
- Kolom ini nullable (boleh kosong)
- Jika kosong, sistem akan menggunakan `created_at` sebagai fallback
- Existing data otomatis terisi dengan tanggal dari `created_at`
