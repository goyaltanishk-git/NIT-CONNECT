-- Migration: widen job_daily_slots.slot_no check to allow premium users (up to 5)
BEGIN;

ALTER TABLE public.job_daily_slots
  DROP CONSTRAINT IF EXISTS job_daily_slots_slot_no_check;

ALTER TABLE public.job_daily_slots
  ADD CONSTRAINT job_daily_slots_slot_no_check CHECK (slot_no BETWEEN 1 AND 5);

COMMIT;
