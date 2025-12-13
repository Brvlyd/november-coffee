# INSTRUKSI MIGRASI DATABASE - SISTEM SHIFT

## ⚠️ PENTING: Jalankan SQL ini di Supabase Dashboard

Untuk mengubah sistem dari per-hari menjadi per-shift (3 shift: Pagi, Malam, Dini Hari), jalankan SQL berikut di **Supabase SQL Editor**:

### Langkah 1: Buka Supabase Dashboard
1. Login ke https://supabase.com/dashboard
2. Pilih project **November Coffee**
3. Klik **SQL Editor** di sidebar

### Langkah 2: Jalankan Migration SQL
Copy-paste dan run SQL ini:

```sql
-- Add shift_id column to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS shift_id INTEGER;

-- Remove the old unique constraint (employee_id, date)
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_employee_id_date_key;

-- Create new unique constraint for (employee_id, date, shift_id)
-- This allows one attendance per shift per day
ALTER TABLE attendance 
ADD CONSTRAINT attendance_employee_id_date_shift_key 
UNIQUE (employee_id, date, shift_id);

-- Update existing records to have shift_id based on check_in_at time
-- Shift 1 (Pagi): 11:00 - 19:00
-- Shift 2 (Malam): 19:00 - 03:00
-- Shift 3 (Dini Hari): 03:00 - 11:00
UPDATE attendance 
SET shift_id = CASE
  WHEN EXTRACT(HOUR FROM check_in_at) >= 11 AND EXTRACT(HOUR FROM check_in_at) < 19 THEN 1
  WHEN EXTRACT(HOUR FROM check_in_at) >= 19 OR EXTRACT(HOUR FROM check_in_at) < 3 THEN 2
  ELSE 3
END
WHERE shift_id IS NULL;
```

### Langkah 3: Verifikasi
Setelah migration berhasil, verifikasi dengan query:

```sql
-- Cek apakah shift_id sudah ada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'attendance' AND column_name = 'shift_id';

-- Cek data attendance dengan shift
SELECT date, employee_id, shift_id, check_in_at, check_out_at 
FROM attendance 
ORDER BY date DESC, shift_id 
LIMIT 10;
```

## 📋 Penjelasan Shift

### Shift 1 - Pagi (ID: 1)
- Jam: **11:00 - 19:00**
- Durasi: 8 jam

### Shift 2 - Malam (ID: 2)
- Jam: **19:00 - 03:00** (melewati tengah malam)
- Durasi: 8 jam

### Shift 3 - Dini Hari (ID: 3)
- Jam: **03:00 - 11:00**
- Durasi: 8 jam

## ✅ Setelah Migration

Sistem akan otomatis:
- ✅ Detect shift berdasarkan waktu login
- ✅ Tampilkan info shift di login page
- ✅ Validasi check-in/check-out per shift (bukan per hari)
- ✅ Memungkinkan karyawan kerja multiple shift dalam sehari
- ✅ Mencegah duplicate check-in untuk shift yang sama

## 🔧 Troubleshooting

**Error: "duplicate key value violates unique constraint"**
- Pastikan sudah drop constraint lama: `attendance_employee_id_date_key`
- Jalankan ulang migration dari awal

**Shift_id masih NULL setelah migration**
- Pastikan UPDATE query dijalankan
- Cek apakah ada record dengan check_in_at NULL

## 📞 Support
Jika ada masalah, cek console log di development server untuk detail error.
