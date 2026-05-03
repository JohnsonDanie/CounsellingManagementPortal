-- ============================================================
-- FIX-06: Make crisis_flags.assessment_id nullable
-- Allows chatbot-triggered alerts before a formal assessment
-- Apply via: Supabase SQL Editor or supabase db push
-- ============================================================

ALTER TABLE public.crisis_flags
  ALTER COLUMN assessment_id DROP NOT NULL;

COMMENT ON COLUMN public.crisis_flags.assessment_id IS
  'Optional FK to assessments. May be NULL for chatbot-triggered crisis alerts raised before a formal assessment is completed.';
