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
