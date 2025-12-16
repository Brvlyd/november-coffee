# 🔧 Cara Memperbaiki Login di Vercel

## ❌ Masalah
Login tidak berfungsi di Vercel meskipun database sudah benar dan karyawan sudah dihapus/ditambahkan dengan benar.

## 🎯 Penyebab
**Environment variables (SUPABASE_URL dan SUPABASE_ANON_KEY) tidak dikonfigurasi di Vercel!**

Tanpa environment variables ini, aplikasi tidak bisa terhubung ke database Supabase, sehingga login selalu gagal.

## ✅ Solusi Lengkap

### Langkah 1: Dapatkan Credentials Supabase Anda

1. **Buka Dashboard Supabase:**
   - Pergi ke https://supabase.com/dashboard
   - Login dengan akun Anda
   - Pilih project November Coffee Anda

2. **Copy Project URL dan Anon Key:**
   - Klik icon ⚙️ **Settings** di sidebar kiri
   - Pilih **API**
   - Anda akan melihat:
     - **Project URL** (contoh: `https://abcdefghijklmn.supabase.co`)
     - **Project API keys > anon public** (string panjang yang dimulai dengan `eyJ...`)
   
3. **Simpan kedua values ini** - Anda akan perlu di langkah berikutnya!

---

### Langkah 2: Tambahkan Environment Variables di Vercel

1. **Buka Dashboard Vercel:**
   - Pergi ke https://vercel.com/dashboard
   - Login dengan akun Anda
   - Pilih project **november-coffee**

2. **Masuk ke Settings:**
   - Klik tab **Settings** di bagian atas
   - Scroll ke bawah dan klik **Environment Variables** di sidebar kiri

3. **Tambahkan Variable Pertama:**
   - Klik tombol **Add New**
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** Paste Project URL dari Supabase (contoh: `https://abcdefghijklmn.supabase.co`)
   - Pastikan checkbox **Production**, **Preview**, dan **Development** semua dicentang ✅
   - Klik **Save**

4. **Tambahkan Variable Kedua:**
   - Klik tombol **Add New** lagi
   - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** Paste Anon Key dari Supabase (string panjang `eyJ...`)
   - Pastikan checkbox **Production**, **Preview**, dan **Development** semua dicentang ✅
   - Klik **Save**

5. **(Optional) Tambahkan OCR API Key:**
   - Klik tombol **Add New** lagi
   - **Name:** `OCR_SPACE_API_KEY`
   - **Value:** `K81729156788957`
   - Pastikan checkbox **Production**, **Preview**, dan **Development** semua dicentang ✅
   - Klik **Save**

---

### Langkah 3: Redeploy Aplikasi

Setelah menambahkan environment variables, Anda **HARUS redeploy** untuk perubahan berlaku:

**Opsi A - Redeploy Otomatis (Recommended):**
1. Kembali ke tab **Deployments**
2. Cari deployment terakhir yang sukses
3. Klik tombol **•••** (three dots) di sebelah kanan
4. Pilih **Redeploy**
5. Klik **Redeploy** lagi untuk konfirmasi
6. Tunggu hingga status menjadi **Ready** (biasanya 1-3 menit)

**Opsi B - Push ke Git:**
1. Buat perubahan kecil di project (atau gunakan perintah):
   ```bash
   git commit --allow-empty -m "Trigger redeploy for env vars"
   git push
   ```
2. Vercel akan otomatis deploy ulang

---

### Langkah 4: Verifikasi

1. **Tunggu hingga deployment selesai** (status jadi **Ready** dengan ✅)
2. **Buka aplikasi Vercel Anda** (klik **Visit**)
3. **Coba login dengan:**
   - **Admin:**
     - ID: `admin`
     - Password: `mahasiswabinus`
   - **Karyawan lain** (jika ada di database)

4. **Jika masih error:**
   - Buka **Chrome DevTools** (F12)
   - Lihat tab **Console** untuk error messages
   - Lihat tab **Network** untuk melihat response dari `/api/login`
   - Screenshot error dan share untuk debugging lebih lanjut

---

## 🔍 Cara Cek Environment Variables Sudah Benar

1. **Di Vercel Dashboard:**
   - Settings → Environment Variables
   - Pastikan ada 2 variables:
     - ✅ `NEXT_PUBLIC_SUPABASE_URL`
     - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Pastikan **Production** dicentang

2. **Di Browser (Test Production):**
   - Buka aplikasi Vercel Anda
   - Buka DevTools (F12) → Console
   - Ketik: `process.env.NEXT_PUBLIC_SUPABASE_URL`
   - Harusnya muncul URL Supabase Anda (bukan `https://placeholder.supabase.co`)

---

## 📝 Untuk Development Lokal

Jika Anda ingin test di localhost, buat file `.env.local`:

1. **Copy file template:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your_key_here...
   OCR_SPACE_API_KEY=K81729156788957
   ```

3. **Restart development server:**
   ```bash
   npm run dev
   ```

---

## ⚠️ Catatan Penting

1. **Jangan commit `.env.local` ke Git!**
   - File ini sudah ada di `.gitignore`
   - Environment variables production harus di Vercel Dashboard

2. **Setiap kali ubah environment variables di Vercel, harus redeploy!**

3. **Database Supabase sudah benar** - masalahnya cuma di environment variables Vercel

4. **Pastikan RLS (Row Level Security) di Supabase sudah dikonfigurasi** dengan benar:
   - Lihat [DATABASE_SETUP.md](./DATABASE_SETUP.md) untuk detail

---

## 🆘 Troubleshooting

### Login masih gagal setelah setup?

**1. Pastikan environment variables benar:**
```
Settings → Environment Variables → Lihat nilai NEXT_PUBLIC_SUPABASE_URL
```

**2. Cek di browser console:**
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
// Harusnya: https://xxx.supabase.co
// BUKAN: https://placeholder.supabase.co
```

**3. Cek database ada data karyawan:**
- Buka Supabase Dashboard
- Table Editor → employees
- Pastikan ada minimal 1 karyawan (admin)

**4. Cek password benar:**
- Default admin password: `mahasiswabinus`
- Passwords case-sensitive!

**5. Lihat error di Vercel logs:**
- Vercel Dashboard → Deployments
- Klik deployment terakhir
- Klik tab **Functions**
- Lihat logs untuk error messages

---

## 📞 Butuh Bantuan?

Jika masih bermasalah setelah ikuti semua langkah:

1. Screenshot error message di browser
2. Screenshot environment variables di Vercel (sensor nilai anon key)
3. Screenshot data employees di Supabase
4. Share untuk debugging lebih lanjut

---

**Good luck! 🚀**
