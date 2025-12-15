-- Migration: Add join_date column to employees table
-- Date: December 16, 2025
-- Description: Adds join_date field to track when employee joined the company

-- Add join_date column (nullable, defaults to created_at for existing employees)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS join_date DATE;

-- Update existing employees to use created_at as join_date
UPDATE employees 
SET join_date = created_at::date 
WHERE join_date IS NULL;

-- Optional: Add comment to column
COMMENT ON COLUMN employees.join_date IS 'Date when employee joined the company';
