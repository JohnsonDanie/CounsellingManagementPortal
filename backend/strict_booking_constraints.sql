-- STRESS-TESTING & CONCURRENCY PROTECTION (REVISED)
-- Fixing the "IMMUTABLE" error by using a persistent column for the end time.

-- Step 1: Enable the required Postgres extension
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Step 2: Add a dedicated end_time column to the appointments table
-- This avoids "stable" calculation issues in the index.
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS appointment_end timestamptz;

-- Step 3: Create a function to automatically calculate the end time (start + duration + buffer)
CREATE OR REPLACE FUNCTION calculate_appointment_end_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.appointment_end := NEW.appointment_time + ((NEW.duration_minutes + NEW.buffer_minutes) * interval '1 minute');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Add a trigger to keep appointment_end in sync
DROP TRIGGER IF EXISTS sync_appointment_end ON public.appointments;
CREATE TRIGGER sync_appointment_end
BEFORE INSERT OR UPDATE OF appointment_time, duration_minutes, buffer_minutes
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION calculate_appointment_end_trigger();

-- Step 5: Update existing data to populate the new column
UPDATE public.appointments 
SET appointment_end = appointment_time + ((duration_minutes + buffer_minutes) * interval '1 minute')
WHERE appointment_end IS NULL;

-- Step 6: Add the exclusion constraint using the persistent columns
-- This prevents overlapping time ranges for the same counselor_id
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS prevent_overlapping_appointments;

ALTER TABLE public.appointments
ADD CONSTRAINT prevent_overlapping_appointments
EXCLUDE USING gist (
  counselor_id WITH =,
  tstzrange(appointment_time, appointment_end, '[)') WITH &&
)
WHERE (status != 'cancelled');
