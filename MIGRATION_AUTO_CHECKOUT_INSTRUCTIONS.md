# Migration: Auto Checkout Column Setup

## Purpose
Add `auto_checkout` and `notes` columns to the attendance table to track which checkouts were done automatically by the system vs manually by employees.

## Instructions

### Step 1: Run Migration in Supabase

1. Login to your Supabase dashboard: https://app.supabase.com
2. Select your November Coffee project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `migration_add_auto_checkout.sql`
6. Click **Run** button

### Step 2: Verify Migration

Run this query to verify the columns were added:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'attendance' 
AND column_name IN ('auto_checkout', 'notes');
```

Expected result:
```
column_name   | data_type | is_nullable | column_default
--------------+-----------+-------------+----------------
auto_checkout | boolean   | YES         | false
notes         | text      | YES         | NULL
```

### Step 3: Test Auto Checkout

After migration, test the auto-checkout endpoint:

```bash
curl -X POST http://localhost:3000/api/attendance/auto-checkout \
  -H "Authorization: Bearer your-secret-token"
```

Check if the `auto_checkout` column is set to `true` for auto-checked-out records:

```sql
SELECT 
  e.full_name,
  a.date,
  a.check_in_at,
  a.check_out_at,
  a.auto_checkout,
  a.notes
FROM attendance a
JOIN employees e ON a.employee_id = e.id
WHERE a.auto_checkout = true
ORDER BY a.date DESC, a.check_out_at DESC
LIMIT 10;
```

## Benefits

1. **Audit Trail**: Know which checkouts were automatic vs manual
2. **Analytics**: Track how many employees forget to checkout
3. **Transparency**: Employees can see if they were auto-checked out
4. **Debugging**: Easier to troubleshoot checkout issues

## Rollback (if needed)

If you need to remove these columns:

```sql
ALTER TABLE attendance DROP COLUMN IF EXISTS auto_checkout;
ALTER TABLE attendance DROP COLUMN IF EXISTS notes;
DROP INDEX IF EXISTS idx_attendance_auto_checkout;
```

## Notes

- This migration is **backward compatible** - existing attendance records won't be affected
- The `auto_checkout` column defaults to `false` for all existing and new manual checkouts
- The `notes` column is optional and can be used for other purposes too
