# 🚀 Quick Start Guide - November Coffee

## ⚡ Getting Started in 5 Minutes

### Step 1: Setup Supabase Database

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up or log in
   - Click "New Project"

2. **Create Database Tables**
   - Open your project dashboard
   - Go to **SQL Editor** (left sidebar)
   - Click "New Query"
   - Copy and paste the SQL from `DATABASE_SETUP.md`
   - Click "Run" (or press Ctrl+Enter)

3. **Get Your Credentials**
   - Go to **Settings** → **API**
   - Copy your:
     - **Project URL** (looks like: `https://xxxxx.supabase.co`)
     - **anon/public key** (long string starting with `eyJ...`)

### Step 2: Configure Environment Variables

1. Open `.env.local` file in the project root
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 Testing the App

### Test Employee Login

1. Click "Login" button
2. Enter credentials:
   - **ID**: `EMP001`
   - **Password**: `password123`
3. You should see: "✅ Anda telah check-in"

### Test Admin Login

1. Click "Login" button
2. Enter credentials:
   - **ID**: `admin`
   - **Password**: `mahasiswabinus`
3. You will be redirected to the admin dashboard

## 📊 Admin Dashboard Features

### 1. Overview (Dashboard Home)
- View statistics: total employees, attendance today, inventory stats
- System status indicators
- Low stock alerts

### 2. Kelola Karyawan (Manage Employees)
- Click "Tambah Karyawan" to add new employee
- Fill in: ID Karyawan, Nama, Role, Password
- Edit or delete existing employees

### 3. Kelola Inventori (Manage Inventory)
- Click "Tambah Item" to add inventory
- Fill in: Nama Barang, Jumlah, Kategori, Catatan
- Items with quantity < 10 show warning indicator

### 4. Monitoring Absensi (Attendance)
- View all attendance records
- Filter by date
- Export to CSV for reporting
- See check-in/check-out times and duration

## 🐛 Troubleshooting

### Issue: "Cannot find module @supabase/supabase-js"
**Solution:**
```bash
npm install
```

### Issue: Database connection error
**Solution:**
- Verify your Supabase URL and key in `.env.local`
- Make sure you ran the SQL schema
- Check if Supabase project is active

### Issue: Build errors
**Solution:**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Issue: Page not updating
**Solution:**
- Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache
- Restart dev server

## 📱 Testing on Mobile

1. Find your local IP address:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. Access from phone:
   ```
   http://YOUR-IP:3000
   ```
   Example: `http://192.168.1.100:3000`

## 🎨 Customization Tips

### Change Theme Color

Edit `app/globals.css`:
```css
:root {
  --orange-primary: #your-color;
}
```

### Add New Employee Role

Edit `app/admin/employees/page.tsx`:
```tsx
<option value="manager">Manager</option>
```

### Modify Low Stock Threshold

Edit `app/admin/page.tsx`:
```tsx
.lt('jumlah', 20) // Change from 10 to 20
```

## 📚 Next Steps

- [ ] Add more employees
- [ ] Populate inventory items
- [ ] Test check-in flow
- [ ] Test check-out functionality
- [ ] Generate attendance report
- [ ] Deploy to Vercel (see DEPLOYMENT.md)

## 💡 Pro Tips

1. **Auto Check-in**: Employees automatically check-in when they login
2. **Duplicate Prevention**: System prevents multiple check-ins same day
3. **Late Detection**: Check-in after 8:00 AM marked as late
4. **CSV Export**: Use for monthly reports

## 🆘 Need Help?

- Check `DATABASE_SETUP.md` for database issues
- Check `DEPLOYMENT.md` for deployment help
- Review `README.md` for complete documentation

---

**Happy coding! ☕**
