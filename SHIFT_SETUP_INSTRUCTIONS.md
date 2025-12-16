# 🔧 Setup Shift untuk Attendance System

## ❌ Masalah
- Karyawan tidak bisa check-in (error 400)
- Shift terdeteksi salah (muncul "Dini Hari" padahal seharusnya "Pagi")

## 🎯 Penyebab
1. **Missing kolom `shift_id` di database** - tabel `attendance` belum punya kolom untuk track shift
2. **Timezone bug** - fungsi `getCurrentShift()` tidak menggunakan WIB

## ✅ Solusi

### Langkah 1: Update Database dengan Migration

1. **Buka Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Pilih project November Coffee
   - Klik **SQL Editor** di sidebar kiri

2. **Jalankan Migration SQL:**
   - Copy semua kode dari file `migration_add_shift.sql`
   - Atau copy kode dibawah ini:

```sql
-- Add shift_id column to attendance table
-- This will track which shift (1=Pagi, 2=Malam, 3=Dini Hari) the attendance is for

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS shift_id INTEGER;

-- Remove the unique constraint if it exists (to allow multiple shifts per day)
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_employee_id_date_key;

-- Create new unique constraint for employee_id, date, and shift_id
-- This ensures one attendance record per employee per shift per day
ALTER TABLE attendance 
ADD CONSTRAINT attendance_employee_id_date_shift_key 
UNIQUE (employee_id, date, shift_id);

-- Update existing records to have shift_id based on check_in_at time
UPDATE attendance 
SET shift_id = CASE
  WHEN EXTRACT(HOUR FROM check_in_at) >= 11 AND EXTRACT(HOUR FROM check_in_at) < 19 THEN 1
  WHEN EXTRACT(HOUR FROM check_in_at) >= 19 OR EXTRACT(HOUR FROM check_in_at) < 3 THEN 2
  ELSE 3
END
WHERE shift_id IS NULL;
```

3. **Run Query:**
   - Paste di SQL Editor
   - Klik **Run** atau tekan `Ctrl+Enter`
   - Tunggu hingga selesai
   - Harusnya ada pesan: **Success. No rows returned**

4. **Verifikasi:**
   - Klik **Table Editor** → pilih tabel `attendance`
   - Pastikan ada kolom baru `shift_id`

---

### Langkah 2: Deploy Code Changes ke Vercel

Kode sudah diperbaiki untuk fix timezone bug. Sekarang deploy ke Vercel:

#### Opsi A: Git Push (Recommended)
```bash
cd "C:\ebeb\Tugas\Codingan\November Coffee\november-coffee"
git add .
git commit -m "Fix shift timezone bug and attendance system"
git push
```

#### Opsi B: Manual Redeploy di Vercel
1. Buka Vercel Dashboard
2. Tab **Deployments**
3. Klik **•••** pada deployment terakhir
4. Pilih **Redeploy**

---

### Langkah 3: Test Login Karyawan

Setelah migration dan deployment selesai:

1. **Buka aplikasi Vercel** (bukan localhost!)
2. **Login sebagai karyawan** (bukan admin)
3. **Coba Check-in**

**Shift Schedule:**
- **Shift Pagi**: 11:00 - 19:00
- **Shift Malam**: 19:00 - 03:00  
- **Shift Dini Hari**: 03:00 - 11:00

**Waktu Check-in yang Dibolehkan:**
- Bisa check-in **10 menit sebelum shift dimulai**
- Contoh: Shift Pagi mulai 11:00, bisa check-in dari jam 10:50

**Keterlambatan:**
- Karyawan yang telat **tetap bisa check-in**
- System akan catat keterlambatan untuk potongan gaji
- ⚠️ Note: Fitur perhitungan potongan gaji belum diimplementasi

---

## 🔍 Verifikasi Shift Detection

Untuk cek apakah shift detection sudah benar:

1. **Di Browser Console (F12):**
   ```javascript
   // Cek shift saat ini
   fetch('/api/attendance/check-status?employeeId=EMP001')
     .then(r => r.json())
     .then(d => console.log('Current Shift:', d.shift))
   ```

2. **Test di berbagai waktu:**
   - **Jam 08:00 WIB** → Harusnya: Shift Dini Hari
   - **Jam 12:00 WIB** → Harusnya: Shift Pagi  
   - **Jam 20:00 WIB** → Harusnya: Shift Malam
   - **Jam 01:00 WIB** → Harusnya: Shift Malam

---

## 📝 Perubahan yang Dibuat

### 1. lib/shift.ts
**Sebelum:**
```typescript
export function getCurrentShift(): Shift {
  const now = new Date();
  const currentHour = now.getHours(); // ❌ Local time, bukan WIB!
  // ...
}
```

**Sesudah:**
```typescript
export function getCurrentShift(): Shift {
  const now = new Date();
  // Konversi ke WIB (UTC+7)
  const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const currentHour = wibTime.getUTCHours(); // ✅ WIB!
  // ...
}
```

### 2. Database Schema
**Ditambahkan:**
- Kolom `shift_id` di tabel `attendance`
- Unique constraint `(employee_id, date, shift_id)`
- Karyawan bisa check-in multiple shifts dalam satu hari

---

## ⚠️ Catatan Penting

1. **Migration HARUS dijalankan di Supabase** sebelum karyawan bisa check-in
2. **Jangan lupa deploy/push code** setelah migration
3. **Test dengan waktu real** - shift detection berdasarkan WIB
4. **Vercel mungkin punya timezone berbeda** dari server lokal

---

## 🆘 Troubleshooting

### Karyawan masih tidak bisa check-in?

**1. Cek migration sudah jalan:**
```sql
-- Run di Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'attendance' AND column_name = 'shift_id';
```
Harusnya return 1 row dengan `shift_id | integer`

**2. Cek shift detection:**
- Buka `/login` page
- Lihat informasi shift di halaman login
- Pastikan shift yang ditampilkan sesuai dengan waktu WIB saat ini

**3. Cek error di Vercel Logs:**
- Vercel Dashboard → Deployments → Functions
- Lihat error message detail

**4. Clear browser cache:**
- Hard refresh: `Ctrl + Shift + R`
- Atau clear cache di DevTools

### Shift masih salah terdeteksi?

**Cek timezone server:**
1. Buka browser console
2. Test:
   ```javascript
   const now = new Date();
   const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
   console.log('Local:', now.getHours(), 'WIB:', wibTime.getUTCHours());
   ```
3. Pastikan WIB hours sesuai dengan jam di Indonesia

---

## 📞 Next Steps

Setelah fix ini, masih ada fitur yang perlu ditambahkan:

1. ✅ Fix timezone bug
2. ✅ Add shift_id ke database
3. ⏳ **Implementasi perhitungan keterlambatan**
4. ⏳ **Implementasi potongan gaji otomatis**
5. ⏳ **Laporan attendance per shift**

---

**Good luck! 🚀**
