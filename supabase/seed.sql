-- ============================================================
-- SEED DATA — Run AFTER schema.sql
-- NOTE: Create the 3 auth users via Supabase Dashboard or CLI first,
--       then replace the UUIDs below with the actual auth.users IDs.
--
-- CLI method (run these before this script):
--   supabase auth create-user --email admin@school.ac.th --password password123
--   supabase auth create-user --email teacher1@school.ac.th --password password123
--   supabase auth create-user --email student1@school.ac.th --password password123
-- ============================================================

-- ── Step 1: Insert profiles (use real UUIDs from auth.users) ──────────────
-- Replace these placeholder UUIDs with the actual IDs from your Supabase Auth dashboard.

DO $$
DECLARE
  v_admin_id   UUID;
  v_teacher_id UUID;
  v_student_id UUID;
  v_class_id   UUID;
  v_form_id    UUID;
  v_period_id  UUID;
  v_assign_id  UUID;
BEGIN

  -- ── Fetch user IDs from auth.users ──────────────────────────────────────
  SELECT id INTO v_admin_id   FROM auth.users WHERE email = 'admin@school.ac.th'   LIMIT 1;
  SELECT id INTO v_teacher_id FROM auth.users WHERE email = 'teacher1@school.ac.th' LIMIT 1;
  SELECT id INTO v_student_id FROM auth.users WHERE email = 'student1@school.ac.th' LIMIT 1;

  IF v_admin_id IS NULL OR v_teacher_id IS NULL OR v_student_id IS NULL THEN
    RAISE EXCEPTION 'Auth users not found. Create them first via Supabase Auth dashboard or CLI.';
  END IF;

  -- ── Profiles ────────────────────────────────────────────────────────────
  INSERT INTO public.profiles (id, full_name, role, school_id, employee_id, student_number, subject)
  VALUES
    (v_admin_id,   'ผู้ดูแลระบบ',              'admin',   'SCH001', NULL,   NULL,     NULL),
    (v_teacher_id, 'ครูสมหญิง รักเรียน',       'teacher', 'SCH001', 'T001', NULL,     'คอมพิวเตอร์เบื้องต้น'),
    (v_student_id, 'ด.ช. ใจดี ตั้งใจเรียน',   'student', 'SCH001', NULL,   'S66001', NULL)
  ON CONFLICT (id) DO NOTHING;

  -- ── Class ───────────────────────────────────────────────────────────────
  INSERT INTO public.classes (id, name, academic_year)
  VALUES (gen_random_uuid(), 'ม.4/1', '2567')
  RETURNING id INTO v_class_id;

  -- ── Evaluation Form ─────────────────────────────────────────────────────
  INSERT INTO public.evaluation_forms (id, title, description, is_active, created_by)
  VALUES (
    gen_random_uuid(),
    'แบบประเมินคุณภาพการสอน ภาคเรียนที่ 1/2567',
    'แบบประเมินมาตรฐาน 5 ระดับ สำหรับนักเรียนประเมินครูผู้สอน',
    true,
    v_admin_id
  )
  RETURNING id INTO v_form_id;

  -- ── Questions ───────────────────────────────────────────────────────────
  INSERT INTO public.evaluation_questions (form_id, question_text, question_type, min_value, max_value, order_index)
  VALUES
    (v_form_id, 'ครูอธิบายเนื้อหาได้ชัดเจนและเข้าใจง่าย',                  'rating', 1, 5, 1),
    (v_form_id, 'ครูเตรียมการสอนและมีสื่อการสอนที่เหมาะสม',                  'rating', 1, 5, 2),
    (v_form_id, 'ครูให้ความสนใจและดูแลนักเรียนทุกคนอย่างเท่าเทียม',          'rating', 1, 5, 3),
    (v_form_id, 'ครูพูดจาสุภาพ ให้เกียรติและไม่ดูถูกนักเรียน',              'rating', 1, 5, 4),
    (v_form_id, 'ครูตรงต่อเวลาและเข้าสอนสม่ำเสมอ',                          'rating', 1, 5, 5),
    (v_form_id, 'ครูเปิดโอกาสให้นักเรียนซักถามและแสดงความคิดเห็น',          'rating', 1, 5, 6),
    (v_form_id, 'ข้อเสนอแนะเพิ่มเติมสำหรับครู (ถ้ามี)',                     'text',   NULL, NULL, 7);

  -- ── Evaluation Period ────────────────────────────────────────────────────
  INSERT INTO public.evaluation_periods (id, form_id, title, start_at, end_at, is_active)
  VALUES (
    gen_random_uuid(),
    v_form_id,
    'ช่วงประเมิน ภาคเรียนที่ 1/2567',
    NOW(),
    NOW() + INTERVAL '30 days',
    true
  )
  RETURNING id INTO v_period_id;

  -- ── Teacher Assignment (student1 evaluates teacher1) ────────────────────
  INSERT INTO public.teacher_assignments (id, student_id, teacher_id, form_id, period_id, class_id)
  VALUES (
    gen_random_uuid(),
    v_student_id,
    v_teacher_id,
    v_form_id,
    v_period_id,
    v_class_id
  )
  RETURNING id INTO v_assign_id;

  RAISE NOTICE 'Seed data inserted successfully.';
  RAISE NOTICE 'admin_id=%, teacher_id=%, student_id=%', v_admin_id, v_teacher_id, v_student_id;
  RAISE NOTICE 'form_id=%, period_id=%, assignment_id=%', v_form_id, v_period_id, v_assign_id;

END $$;
