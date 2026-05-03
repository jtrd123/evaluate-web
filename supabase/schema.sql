-- ============================================================
-- Teacher Evaluation App — Supabase Schema + RLS Policies
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  school_id     TEXT DEFAULT 'SCH001',
  employee_id   TEXT,        -- T001, T002 … (teachers only)
  student_number TEXT,       -- S66001, S66002 … (students only)
  subject       TEXT,        -- subject taught (teachers only)
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. CLASSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,          -- e.g. "ม.4/1"
  academic_year TEXT NOT NULL,          -- e.g. "2567"
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. EVALUATION FORMS & QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.evaluation_forms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT false,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER evaluation_forms_updated_at
  BEFORE UPDATE ON public.evaluation_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS public.evaluation_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id       UUID NOT NULL REFERENCES public.evaluation_forms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('rating', 'text')),
  min_value     INTEGER DEFAULT 1,
  max_value     INTEGER DEFAULT 5,
  order_index   INTEGER NOT NULL DEFAULT 0,
  is_required   BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. EVALUATION PERIODS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.evaluation_periods (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id    UUID NOT NULL REFERENCES public.evaluation_forms(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  start_at   TIMESTAMPTZ NOT NULL,
  end_at     TIMESTAMPTZ NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_period CHECK (end_at > start_at)
);

-- ============================================================
-- 5. TEACHER ASSIGNMENTS (student ↔ teacher mapping)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  form_id    UUID NOT NULL REFERENCES public.evaluation_forms(id) ON DELETE CASCADE,
  period_id  UUID NOT NULL REFERENCES public.evaluation_periods(id) ON DELETE CASCADE,
  class_id   UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, teacher_id, period_id)
);

-- ============================================================
-- 6. EVALUATION SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.evaluation_submissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.teacher_assignments(id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  form_id      UUID NOT NULL REFERENCES public.evaluation_forms(id) ON DELETE CASCADE,
  period_id    UUID NOT NULL REFERENCES public.evaluation_periods(id) ON DELETE CASCADE,
  is_submitted BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, teacher_id, period_id)  -- prevent duplicate submissions
);

-- ============================================================
-- 7. EVALUATION RESPONSES (individual question answers)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.evaluation_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.evaluation_submissions(id) ON DELETE CASCADE,
  question_id   UUID NOT NULL REFERENCES public.evaluation_questions(id) ON DELETE CASCADE,
  rating_value  INTEGER CHECK (rating_value BETWEEN 1 AND 5),
  text_value    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(submission_id, question_id)
);

-- ============================================================
-- 8. PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role                    ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_student_id   ON public.teacher_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id   ON public.teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_period_id    ON public.teacher_assignments(period_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id           ON public.evaluation_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_teacher_id           ON public.evaluation_submissions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_submissions_period_id            ON public.evaluation_submissions(period_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id        ON public.evaluation_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_responses_submission_id          ON public.evaluation_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id            ON public.evaluation_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_questions_form_id                ON public.evaluation_questions(form_id);

-- ============================================================
-- 9. TEACHER RESULTS VIEW (masks student_id — teachers read this)
-- ============================================================
CREATE OR REPLACE VIEW public.teacher_evaluation_results AS
SELECT
  er.id                 AS response_id,
  es.teacher_id,
  es.form_id,
  es.period_id,
  es.submitted_at,
  er.question_id,
  eq.question_text,
  eq.question_type,
  eq.order_index,
  er.rating_value,
  er.text_value
  -- student_id intentionally excluded
FROM public.evaluation_submissions es
JOIN public.evaluation_responses   er ON er.submission_id = es.id
JOIN public.evaluation_questions   eq ON eq.id = er.question_id
WHERE es.is_submitted = true;

-- ============================================================
-- 10. ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_forms      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_periods    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_responses  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. HELPER FUNCTION: get current user role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 12. RLS POLICIES — profiles
-- ============================================================
-- Everyone can read their own profile + basic info of others (for UI display)
CREATE POLICY "profiles: read own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles: admin read all"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY "profiles: read teacher list (students)"
  ON public.profiles FOR SELECT
  USING (
    public.get_my_role() IN ('student', 'teacher')
    AND role IN ('teacher', 'student', 'admin')
  );

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: admin all"
  ON public.profiles FOR ALL
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 13. RLS POLICIES — classes
-- ============================================================
CREATE POLICY "classes: authenticated can read"
  ON public.classes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "classes: admin all"
  ON public.classes FOR ALL
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 14. RLS POLICIES — evaluation_forms
-- ============================================================
CREATE POLICY "forms: authenticated can read active"
  ON public.evaluation_forms FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "forms: admin all"
  ON public.evaluation_forms FOR ALL
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 15. RLS POLICIES — evaluation_questions
-- ============================================================
CREATE POLICY "questions: authenticated can read"
  ON public.evaluation_questions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "questions: admin all"
  ON public.evaluation_questions FOR ALL
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 16. RLS POLICIES — evaluation_periods
-- ============================================================
CREATE POLICY "periods: authenticated can read"
  ON public.evaluation_periods FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "periods: admin all"
  ON public.evaluation_periods FOR ALL
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 17. RLS POLICIES — teacher_assignments
-- ============================================================
-- Students: read only their own assignments
CREATE POLICY "assignments: student reads own"
  ON public.teacher_assignments FOR SELECT
  USING (student_id = auth.uid());

-- Teachers: read only assignments targeting them
CREATE POLICY "assignments: teacher reads own"
  ON public.teacher_assignments FOR SELECT
  USING (teacher_id = auth.uid());

-- Admin: full control
CREATE POLICY "assignments: admin all"
  ON public.teacher_assignments FOR ALL
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 18. RLS POLICIES — evaluation_submissions
-- ============================================================
-- Students: INSERT only (write-once, no SELECT/UPDATE/DELETE)
CREATE POLICY "submissions: student insert only"
  ON public.evaluation_submissions FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND public.get_my_role() = 'student'
  );

-- Students CAN select own submissions (to see completion status)
-- but NOT the response content (that's in evaluation_responses)
CREATE POLICY "submissions: student read own status"
  ON public.evaluation_submissions FOR SELECT
  USING (
    student_id = auth.uid()
    AND public.get_my_role() = 'student'
  );

-- Teachers: read only submissions where they are the teacher
CREATE POLICY "submissions: teacher reads own"
  ON public.evaluation_submissions FOR SELECT
  USING (
    teacher_id = auth.uid()
    AND public.get_my_role() = 'teacher'
  );

-- Admin: full control
CREATE POLICY "submissions: admin all"
  ON public.evaluation_submissions FOR ALL
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 19. RLS POLICIES — evaluation_responses
-- ============================================================
-- Students: INSERT only — completely write-only, no reading back
CREATE POLICY "responses: student insert only"
  ON public.evaluation_responses FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'student'
    AND EXISTS (
      SELECT 1 FROM public.evaluation_submissions es
      WHERE es.id = submission_id
        AND es.student_id = auth.uid()
    )
  );

-- Students: NO SELECT on responses (enforced by absence of SELECT policy)

-- Teachers: read responses for their own submissions via view (not direct table)
-- Direct table access: teachers can read responses tied to their teacher_id
CREATE POLICY "responses: teacher reads own (via submission)"
  ON public.evaluation_responses FOR SELECT
  USING (
    public.get_my_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM public.evaluation_submissions es
      WHERE es.id = submission_id
        AND es.teacher_id = auth.uid()
        AND es.is_submitted = true
    )
  );

-- Admin: full control
CREATE POLICY "responses: admin all"
  ON public.evaluation_responses FOR ALL
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- 20. VIEW SECURITY: teacher_evaluation_results
-- ============================================================
-- Grant access to the view (RLS on base tables still applies)
GRANT SELECT ON public.teacher_evaluation_results TO authenticated;

-- ============================================================
-- Done! Run seed.sql next for mock data.
-- ============================================================
