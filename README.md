# 🍊 November Coffee - Sistem Absensi & Inventori

Sistem manajemen absensi dan inventori modern yang dibangun dengan Next.js, Supabase, dan Tailwind CSS.

![November Coffee](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)

## ✨ Features

### 🔐 Dual Authentication System
- **Karyawan**: Login otomatis check-in dengan notifikasi
- **Admin**: Dashboard lengkap dengan akses penuh

### 👥 Manajemen Karyawan
- CRUD karyawan dengan role-based access
- Data karyawan: ID, nama, role, password
- Validasi ID karyawan unik

### 📦 Manajemen Inventori
- CRUD inventori real-time
- Tracking stok barang
- Alert untuk stok rendah (< 10)
- Kategori: Bahan Baku, Kemasan, Peralatan

### ✅ Monitoring Absensi
- Check-in/check-out otomatis
- Kalkulasi durasi kerja
- Filter by tanggal dan karyawan
- Export ke CSV
- Status: Hadir, Terlambat, Sedang Bekerja

### 🎨 UI/UX Modern
- Smooth animations dengan Framer Motion
- Responsive design (mobile-first)
- Toast notifications
- Loading states
- Glassmorphism effects
- Orange theme branding

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Date Formatting**: date-fns

## 📋 Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account

## 🚀 Quick Start

### 1. Clone & Install

```bash
npm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `DATABASE_SETUP.md`
3. Copy your project URL and anon key

### 3. Environment Variables

Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Default Credentials

### Admin Login
- **ID**: `admin`
- **Password**: `mahasiswabinus`

### Sample Employee (setelah setup database)
- **ID**: `EMP001`
- **Password**: `password123`

## 📁 Project Structure

```
november-coffee/
├── app/
│   ├── api/                    # API Routes
│   │   ├── login/             # Authentication
│   │   ├── attendance/        # Absensi endpoints
│   │   ├── employees/         # CRUD karyawan
│   │   └── inventori/         # CRUD inventori
│   ├── admin/                 # Admin dashboard
│   │   ├── layout.tsx         # Admin layout + sidebar
│   │   ├── page.tsx           # Overview dashboard
│   │   ├── employees/         # Kelola karyawan
│   │   ├── inventori/         # Kelola inventori
│   │   └── attendance/        # Monitoring absensi
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── globals.css            # Global styles
├── components/
│   ├── ui/                    # Reusable components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   └── LoginModal.tsx         # Login modal component
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── utils.ts              # Utility functions
├── DATABASE_SETUP.md         # Database schema
├── DEPLOYMENT.md             # Deployment guide
└── README.md
```

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy to Vercel:

```bash
npm install -g vercel
vercel
```

## 📝 License

This project is licensed under the MIT License.

---

**Made with ☕ by November Coffee Team**
