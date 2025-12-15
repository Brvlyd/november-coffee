-- Migration: Add kode_barang column to inventori table
-- Date: December 16, 2025
-- Description: Adds auto-generated item code (BRG0001, BRG0002, etc.) to inventory items

-- Add kode_barang column
ALTER TABLE inventori 
ADD COLUMN IF NOT EXISTS kode_barang VARCHAR(8) UNIQUE;

-- Generate kode_barang for existing items
DO $$
DECLARE
  item_record RECORD;
  counter INTEGER := 1;
  new_code VARCHAR(8);
BEGIN
  -- Loop through all existing items that don't have kode_barang
  FOR item_record IN 
    SELECT id FROM inventori 
    WHERE kode_barang IS NULL 
    ORDER BY created_at ASC
  LOOP
    -- Generate code with format BRG0001
    new_code := 'BRG' || LPAD(counter::TEXT, 4, '0');
    
    -- Update the item with the generated code
    UPDATE inventori 
    SET kode_barang = new_code 
    WHERE id = item_record.id;
    
    -- Increment counter
    counter := counter + 1;
  END LOOP;
END $$;

-- Make kode_barang NOT NULL after populating existing data
ALTER TABLE inventori 
ALTER COLUMN kode_barang SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_inventori_kode_barang ON inventori(kode_barang);

-- Add comment to column
COMMENT ON COLUMN inventori.kode_barang IS 'Auto-generated item code (format: BRG0001)';
