-- ============================================================
-- ADDITIONS — Run after schema.sql
-- ============================================================

-- 1. Add class_id to student profiles (which class they belong to)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON public.profiles(class_id);

-- 2. Global system settings (emergency shutdown, etc.)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  description TEXT,
  updated_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO public.system_settings (key, value, description)
VALUES
  ('evaluations_enabled', 'true',  'ถ้าเป็น false ระบบจะปิดไม่ให้นักเรียนเข้าประเมินทั้งหมด'),
  ('shutdown_message',    'ระบบปิดชั่วคราว กรุณาติดต่อผู้ดูแลระบบ', 'ข้อความที่แสดงเมื่อปิดระบบ')
ON CONFLICT (key) DO NOTHING;

-- RLS for system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings: authenticated can read"
  ON public.system_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "settings: admin can update"
  ON public.system_settings FOR UPDATE
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- 3. Class-teacher subject mapping (class-based assignment source)
--    Admin assigns: teacher → subject → class → form → period
--    System auto-derives student assignments from this table
CREATE TABLE IF NOT EXISTS public.class_teacher_subjects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  form_id    UUID NOT NULL REFERENCES public.evaluation_forms(id) ON DELETE CASCADE,
  period_id  UUID NOT NULL REFERENCES public.evaluation_periods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, teacher_id, period_id)
);

CREATE INDEX IF NOT EXISTS idx_cts_class_id   ON public.class_teacher_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_cts_teacher_id ON public.class_teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_cts_period_id  ON public.class_teacher_subjects(period_id);

ALTER TABLE public.class_teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cts: authenticated can read"
  ON public.class_teacher_subjects FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "cts: admin all"
  ON public.class_teacher_subjects FOR ALL
  USING (public.get_my_role() = 'admin');

-- 4. Function: auto-create teacher_assignments from class_teacher_subjects
--    Call after inserting into class_teacher_subjects to bulk-create individual assignments
CREATE OR REPLACE FUNCTION public.sync_class_assignments(p_cts_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_cts      public.class_teacher_subjects%ROWTYPE;
  v_inserted INTEGER := 0;
BEGIN
  SELECT * INTO v_cts FROM public.class_teacher_subjects WHERE id = p_cts_id;

  INSERT INTO public.teacher_assignments (student_id, teacher_id, form_id, period_id, class_id)
  SELECT
    p.id,
    v_cts.teacher_id,
    v_cts.form_id,
    v_cts.period_id,
    v_cts.class_id
  FROM public.profiles p
  WHERE p.class_id = v_cts.class_id
    AND p.role = 'student'
  ON CONFLICT (student_id, teacher_id, period_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
