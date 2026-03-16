-- Safe migration for members fields refactor
-- Goal: Move from (branch, year, section) to (college_name, phone_number)
-- This script is designed to be rerunnable (idempotent) and non-destructive.
-- It keeps old columns for rollback safety.

BEGIN;

-- 1) Backup existing members data once
CREATE TABLE IF NOT EXISTS members_backup_before_contact_refactor AS
SELECT * FROM members;

-- 2) Add new columns if missing
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS college_name TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 3) Backfill safe defaults for existing rows
-- Keep placeholders explicit so organizers can later clean real values if needed.
UPDATE members
SET college_name = 'Unknown College'
WHERE college_name IS NULL OR btrim(college_name) = '';

UPDATE members
SET phone_number = '0000000000'
WHERE phone_number IS NULL OR btrim(phone_number) = '';

-- 4) Enforce required columns used by the updated app
ALTER TABLE members
  ALTER COLUMN college_name SET NOT NULL,
  ALTER COLUMN phone_number SET NOT NULL;

COMMIT;

-- Optional manual verification queries:
-- SELECT count(*) AS null_college_name FROM members WHERE college_name IS NULL OR btrim(college_name) = '';
-- SELECT count(*) AS null_phone_number FROM members WHERE phone_number IS NULL OR btrim(phone_number) = '';
-- SELECT * FROM members LIMIT 20;

-- Optional phase-2 cleanup (run later only after full verification):
-- ALTER TABLE members DROP COLUMN IF EXISTS branch;
-- ALTER TABLE members DROP COLUMN IF EXISTS year;
-- ALTER TABLE members DROP COLUMN IF EXISTS section;
