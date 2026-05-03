-- ============================================================
-- FORM / PERIOD ADDITIONS — Run in Supabase SQL Editor
-- ============================================================

-- 1. Add academic_year to evaluation_forms (template grouping label only)
ALTER TABLE public.evaluation_forms
  ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2567';

CREATE INDEX IF NOT EXISTS idx_forms_academic_year
  ON public.evaluation_forms(academic_year);

-- 2. Add academic_year to evaluation_periods
--    Periods are the actual deployment rounds; academic_year here
--    enables "show all rounds for year X" queries without joining forms
ALTER TABLE public.evaluation_periods
  ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2567';

CREATE INDEX IF NOT EXISTS idx_periods_academic_year
  ON public.evaluation_periods(academic_year);

-- NOTE: start_at and end_at already exist on evaluation_periods — do NOT
-- duplicate them on evaluation_forms.  Dates always live on periods.
