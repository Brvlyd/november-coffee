# 🍊 November Coffee - Sistem Manajemen Cafe

Sistem manajemen cafe lengkap dengan fitur absensi berbasis shift, inventori dengan OCR, dan payroll otomatis. Dibangun dengan Next.js 16, Supabase, dan Tailwind CSS.

![November Coffee](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)
![Deployed](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)

## ✨ Fitur Utama

### 🔐 Authentication & Login
- **Role-based Authentication**: Admin dan Karyawan
- **Check-in/Check-out**: Karyawan langsung check-in saat login
- **Admin Dashboard**: Akses penuh untuk manajemen
- **Session Management**: Token-based authentication

### ⏰ Sistem Absensi Multi-Shift
- **3 Shift Kerja** (WIB Timezone):
  - 🌅 **Shift Pagi**: 11:00 - 19:00
  - 🌙 **Shift Malam**: 19:00 - 03:00
  - 🌃 **Shift Dini Hari**: 03:00 - 11:00
- **Flexible Check-in**: Karyawan bisa check-in meski telat (tercatat untuk laporan)
- **Auto Check-out**: Otomatis check-out karyawan yang lupa (jam 3 pagi)
- **Multiple Shifts**: Karyawan bisa kerja multiple shifts dalam sehari
- **Tracking Durasi**: Kalkulasi jam kerja otomatis

### 👥 Manajemen Karyawan
- CRUD karyawan lengkap dengan validasi
- Data: ID, Nama, Posisi, Email, Join Date
- Slip Gaji individual dengan perhitungan otomatis
- Track history absensi per karyawan

### 📦 Manajemen Inventori + AI OCR
- **CRUD Inventori**: Tambah, edit, hapus barang
- **OCR Nota**: Upload foto nota → AI ekstrak data → auto-save
- **Monitoring Stok**: Real-time tracking dengan alert stok rendah
- **Kode Barang**: Unique identifier untuk setiap item
- **Kategori**: Bahan Baku, Kemasan, Peralatan, dll
- **History Tracking**: Log perubahan stok

### 💰 Sistem Payroll
- **Perhitungan Gaji Otomatis**: Berdasarkan jam kerja
- **Slip Gaji Digital**: Generate dan view per karyawan
- **Payroll Dashboard**: Overview semua karyawan
- **Export Data**: Excel/CSV untuk akuntansi

### 🎨 UI/UX Modern
- **Framer Motion Animations**: Smooth page transitions
- **Responsive Design**: Mobile-first approach
- **Toast Notifications**: Real-time feedback
- **Loading States**: Skeleton loaders
- **Glassmorphism**: Modern glass effect
- **Orange Branding**: November Coffee theme

## 🛠️ Tech Stack

### Core
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

### Frontend
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Date Formatting**: date-fns

### Backend & Services
- **API**: Next.js API Routes (Serverless)
- **Authentication**: Supabase Auth (Custom)
- **Cron Jobs**: Vercel Cron (Auto checkout)
- **OCR**: OCR.space API (Free tier)

## 📋 Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account (free tier OK)
- Vercel account (optional, untuk deployment)

## 🚀 Setup & Installation

### 1. Clone Repository

```bash
git clone https://github.com/Brvlyd/november-coffee.git
cd november-coffee
npm install
```

### 2. Setup Supabase Database

1. **Buat Project Supabase**:
   - Pergi ke [supabase.com](https://supabase.com)
   - Create new project
   - Tunggu setup selesai (~2 menit)

2. **Jalankan Database Schema**:
   - Buka **SQL Editor** di Supabase Dashboard
   - Copy semua SQL dari file `DATABASE_SETUP.md`
   - Paste dan **Run**
   - Verify: Cek **Table Editor** → harus ada 3 tables (employees, attendance, inventori)

3. **Jalankan Migrations** (PENTING!):
   
   Jalankan migration SQL files satu per satu di SQL Editor:
   
   ```sql
   -- 1. migration_add_shift.sql (untuk multi-shift)
   -- 2. migration_add_join_date.sql (untuk tracking join date)
   -- 3. migration_add_kode_barang.sql (untuk unique item codes)
   -- 4. migration_add_nama_toko.sql (untuk store info)
   -- 5. migration_add_auto_checkout.sql (untuk auto checkout)
   ```

4. **Get Credentials**:
   - Settings → API
   - Copy **Project URL** dan **anon/public key**

### 3. Configure Environment Variables

Buat file `.env.local` di root project:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OCR.space (Optional - untuk fitur OCR nota)
OCR_SPACE_API_KEY=K81729156788957

# Cron Secret (untuk auto checkout)
CRON_SECRET=november-coffee-auto-checkout-2025
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Default Login Credentials

### 👨‍💼 Admin Account
```
ID: admin
Password: password
```

### 👤 Sample Employee (after database setup)
```
ID: EMP001
Password: password123
```

## 📁 Project Structure

```
november-coffee/
├── app/
│   ├── api/                    # API Routes
│   │   ├── login/             # Authentication endpoint
│   │   ├── attendance/        # Check-in/out & monitoring
│   │   │   ├── auto-checkout/ # Auto checkout cron
│   │   │   ├── check-in/      # Manual check-in
│   │   │   └── check-out/     # Manual check-out
│   │   ├── employees/         # Employee CRUD
│   │   └── inventori/         # Inventory CRUD + OCR
│   │       └── process-nota/  # OCR processing
│   ├── admin/                 # Admin Dashboard (protected)
│   │   ├── attendance/        # Attendance monitoring
│   │   ├── employees/         # Employee management
│   │   │   └── [id]/         # Employee details & slip gaji
│   │   ├── inventori/         # Inventory management
│   │   │   ├── input-barang/  # Add items with OCR
│   │   │   └── monitoring-stok/ # Stock monitoring
│   │   └── payroll/           # Payroll dashboard
│   ├── login/                 # Login page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── globals.css            # Global styles
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   └── ToasterProvider.tsx    # Toast notifications
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── shift.ts              # Shift management (WIB timezone)
│   └── utils.ts              # Utility functions
├── migration_*.sql           # Database migrations
├── DATABASE_SETUP.md         # Database schema
└── DEPLOYMENT.md             # Deployment guide
```

## 🚀 Deployment ke Vercel

### Setup Environment Variables di Vercel

**PENTING**: Tanpa environment variables, aplikasi tidak akan berfungsi di production!

1. **Buka Vercel Dashboard** → Pilih project → **Settings** → **Environment Variables**

2. **Tambahkan variables berikut**:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (dari Supabase) | Production, Preview, Development |
| `OCR_SPACE_API_KEY` | `K81729156788957` | Production, Preview, Development |
| `CRON_SECRET` | `november-coffee-auto-checkout-2025` | Production |

3. **Redeploy** setelah menambahkan environment variables

### Quick Deploy

```bash
npm install -g vercel
vercel
```

Atau connect ke GitHub untuk auto-deployment.

### Setup Cron Job (Auto Checkout)

Di Vercel Dashboard:
1. **Settings** → **Cron Jobs**
2. Add new cron:
   - Path: `/api/attendance/auto-checkout`
   - Schedule: `0 3 * * *` (setiap hari jam 3 pagi WIB = 8 PM UTC)

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk panduan deployment lengkap.

## 📚 Dokumentasi Tambahan

- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)**: Schema database lengkap dengan sample data
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Panduan deployment ke Vercel step-by-step
- **[AUTO_CHECKOUT_SETUP.md](./AUTO_CHECKOUT_SETUP.md)**: Setup cron job untuk auto checkout
- **Migration Files** (`migration_*.sql`): Database migrations untuk fitur tambahan

## 🎯 Cara Menggunakan

### Untuk Karyawan:
1. Buka aplikasi → Klik **Login**
2. Masukkan ID dan Password
3. **Check-in**: Otomatis tercatat saat login (atau klik tombol Check-in)
4. **Check-out**: Klik tombol Check-out saat selesai shift
5. View **Slip Gaji**: Admin bisa generate dari menu Employees

### Untuk Admin:
1. Login dengan akun admin
2. **Dashboard**: Overview attendance & inventory
3. **Employees**: Manage karyawan, view slip gaji
4. **Inventori**: 
   - Input manual atau upload foto nota
   - OCR akan ekstrak data dari foto
   - Monitor stok real-time
5. **Attendance**: Monitor kehadiran semua karyawan
6. **Payroll**: Lihat overview gaji semua karyawan

## 🔧 Fitur Canggih

### 🤖 OCR Nota (AI)
Upload foto nota kasir → AI baca otomatis → Data masuk ke inventori

**Cara pakai:**
1. Admin → Inventori → Input Barang
2. Upload foto nota
3. Klik "Proses Nota dengan AI"
4. Review hasil
5. Klik "Simpan ke Inventori"

### ⏰ Auto Checkout
Karyawan yang lupa checkout akan otomatis di-checkout jam 3 pagi (cron job)

### 📊 Multi-Shift Support
Satu karyawan bisa kerja multiple shifts dalam sehari (misal: Pagi + Malam)

### 💰 Slip Gaji Otomatis
Sistem hitung gaji berdasarkan:
- Total jam kerja
- Rate per jam (configurable)
- Potensi potongan keterlambatan (future feature)

## ⚠️ Troubleshooting

### Login tidak bisa di Vercel
**Masalah**: Error 401/500 saat login
**Solusi**: Pastikan environment variables sudah dikonfigurasi di Vercel (lihat section Deployment)

### Shift Detection Salah
**Masalah**: Mendeteksi shift salah (misal: Dini Hari saat seharusnya Pagi)
**Solusi**: System sudah menggunakan WIB timezone. Clear browser cache dan hard refresh.

### Check-in Error 400
**Masalah**: "Anda hanya bisa check-in mulai 10 menit sebelum..."
**Solusi**: Validasi sudah dihapus di versi terbaru. Pastikan sudah deploy kode terbaru.

### OCR Tidak Berfungsi
**Masalah**: Error saat proses nota
**Solusi**: 
1. Pastikan `OCR_SPACE_API_KEY` sudah diset di environment variables
2. Cek quota API (25,000/month untuk free tier)
3. Pastikan foto nota clear dan readable

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**November Coffee Team**
- Built with ☕ and 💻
- Powered by Next.js, Supabase, and AI

---

**Live Demo**: [november-coffee.vercel.app](https://november-coffee.vercel.app) (if deployed)

**Need Help?** Check documentation files atau create an issue di GitHub.
