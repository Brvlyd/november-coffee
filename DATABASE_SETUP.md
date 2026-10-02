# Database Setup - November Coffee

## 📋 Supabase Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key
4. Update `.env.local` with your credentials

### 2. Run SQL Schema

Go to SQL Editor in Supabase and run the following (copy semua dan run sekaligus):

```sql
-- Drop existing tables if needed (HATI-HATI: ini akan hapus semua data!)
-- DROP TABLE IF EXISTS attendance CASCADE;
-- DROP TABLE IF EXISTS employees CASCADE;
-- DROP TABLE IF EXISTS inventori CASCADE;

-- Table: employees
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  position text NOT NULL,
  employment_status text DEFAULT 'Aktif',
  email text UNIQUE,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table: attendance
CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  check_in_at timestamptz,
  check_out_at timestamptz,
  status text DEFAULT 'Hadir',
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Table: inventori
CREATE TABLE inventori (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_barang text NOT NULL,
  jumlah integer DEFAULT 0,
  kategori text,
  catatan text,
  created_at timestamp DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);

-- Insert admin account
INSERT INTO employees (employee_id, full_name, position, employment_status, email, password)
VALUES ('admin', 'Administrator', 'Admin', 'Aktif', 'admin@novembercoffee.com', 'mahasiswabinus');

-- Insert sample employees (optional)
INSERT INTO employees (employee_id, full_name, position, employment_status, email, password)
VALUES 
  ('EMP001', 'Budi Santoso', 'Barista', 'Aktif', 'budi@novembercoffee.com', 'password123'),
  ('EMP002', 'Siti Nurhaliza', 'Kasir', 'Aktif', 'siti@novembercoffee.com', 'password123'),
  ('EMP003', 'Ahmad Wijaya', 'Barista', 'Aktif', 'ahmad@novembercoffee.com', 'password123');

-- Insert sample inventory (optional)
INSERT INTO inventori (nama_barang, jumlah, kategori, catatan)
VALUES 
  ('Kopi Arabica', 50, 'Bahan Baku', 'Stock bagus'),
  ('Susu UHT', 30, 'Bahan Baku', 'Expired: 2024-12-31'),
  ('Gula Pasir', 25, 'Bahan Baku', ''),
  ('Cup Plastik', 200, 'Kemasan', 'Size medium'),
  ('Sedotan', 500, 'Kemasan', '');
```

### 3. Enable Row Level Security (RLS) - Optional

For production, enable RLS policies:

```sql
-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventori ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (for now - adjust for production)
CREATE POLICY "Allow all for authenticated users" ON employees FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON attendance FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON inventori FOR ALL USING (true);
```

## ✅ Verification

Run this query to verify setup:

```sql
SELECT * FROM employees WHERE employee_id = 'admin';
```

You should see the admin account.

## 🔐 Login Credentials

- **Admin**: 
  - ID: `admin`
  - Password: `mahasiswabinus`

- **Sample Employees**:
  - ID: `EMP001`, `EMP002`, `EMP003`
  - Password: `password123`
