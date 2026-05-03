-- สร้าง profiles สำหรับ dev test accounts
-- รันใน Supabase SQL Editor

INSERT INTO public.profiles (id, full_name, role, school_id)
VALUES
  (
    'f9e9f2cd-6ad7-4e2f-980f-61a681e7dd59',
    'ผู้ดูแลระบบ',
    'admin',
    'SCH001'
  ),
  (
    '2dc12d46-647e-402c-9d38-2ed97da22950',
    'ครูทดสอบ',
    'teacher',
    'SCH001'
  ),
  (
    '59029dea-aa75-42e5-86ed-d61746cb88cb',
    'นักเรียนทดสอบ',
    'student',
    'SCH001'
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role      = EXCLUDED.role;
