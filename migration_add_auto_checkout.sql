-- Migration: Add auto_checkout column to attendance table
-- This helps track which checkouts were automatic vs manual

-- Add column to mark auto checkout
ALTER TABLE attendance 
ADD COLUMN auto_checkout boolean DEFAULT false;

-- Add column for notes/remarks
ALTER TABLE attendance 
ADD COLUMN notes text;

-- Create index for querying auto checkouts
CREATE INDEX idx_attendance_auto_checkout ON attendance(auto_checkout);

-- Optional: Update existing records to explicitly mark as manual checkout
UPDATE attendance 
SET auto_checkout = false 
WHERE check_out_at IS NOT NULL AND auto_checkout IS NULL;
