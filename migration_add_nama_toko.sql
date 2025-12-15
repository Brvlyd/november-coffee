-- Migration: Add nama_toko column to inventori table
-- Date: December 16, 2025
-- Description: Adds nama_toko field to inventory items for tracking store name

-- Add nama_toko column (nullable)
ALTER TABLE inventori 
ADD COLUMN IF NOT EXISTS nama_toko VARCHAR(255);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_inventori_nama_toko ON inventori(nama_toko);

-- Add comment to column
COMMENT ON COLUMN inventori.nama_toko IS 'Store name where the item was purchased';
