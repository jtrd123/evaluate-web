import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getAdminOrNull() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { form_id, period_id } = await req.json() as { form_id: string; period_id: string };
  if (!form_id || !period_id) {
    return NextResponse.json({ error: "ต้องระบุ form_id และ period_id" }, { status: 400 });
  }

  const supa = adminClient();

  // 1. ดึงครูทุกคนที่มี teaching_levels
  const { data: teachers } = await supa
    .from("profiles")
    .select("id, full_name, teaching_levels")
    .eq("role", "teacher")
    .not("teaching_levels", "is", null);

  if (!teachers?.length) {
    return NextResponse.json({ assigned: 0, skipped: 0, teachers: 0, message: "ไม่พบครูที่มีข้อมูลชั้นที่สอน" });
  }

  // 2. ดึง class ทั้งหมด
  const { data: classes } = await supa.from("classes").select("id, name");

  // 3. ดึง student + class_id ทั้งหมด
  const { data: students } = await supa
    .from("profiles")
    .select("id, class_id")
    .eq("role", "student")
    .not("class_id", "is", null);

  if (!classes?.length || !students?.length) {
    return NextResponse.json({ assigned: 0, skipped: 0, teachers: 0, message: "ไม่พบข้อมูลห้องเรียนหรือนักเรียน" });
  }

  // Map class_id → class name (สำหรับ lookup เร็ว)
  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  // Map student_id → class_id
  const studentClassMap = new Map(students.map((s) => [s.id, s.class_id as string]));

  let totalAssigned = 0;
  let totalSkipped  = 0;
  let teacherCount  = 0;

  for (const teacher of teachers) {
    if (!teacher.teaching_levels?.trim()) continue;

    // แยกชั้นที่สอน: "ม.2, ม.3, ม.4" → ["ม.2", "ม.3", "ม.4"]
    const levels = teacher.teaching_levels
      .split(",")
      .map((l: string) => l.trim())
      .filter(Boolean);

    // หาห้องที่ match: class name ขึ้นต้นด้วย level + "/"
    // เช่น "ม.2" → match "ม.2/1", "ม.2/2", ...
    const matchedClassIds = new Set(
      classes
        .filter((c) => levels.some((level) => c.name.startsWith(level + "/") || c.name === level))
        .map((c) => c.id)
    );

    if (matchedClassIds.size === 0) continue;

    // หานักเรียนในห้องเหล่านั้น
    const targetStudents = students.filter((s) => matchedClassIds.has(s.class_id as string));
    if (targetStudents.length === 0) continue;

    teacherCount++;

    // Batch upsert assignments
    const rows = targetStudents.map((s) => ({
      student_id: s.id,
      teacher_id: teacher.id,
      form_id,
      period_id,
      class_id: s.class_id,
    }));

    const { data: inserted, error } = await supa
      .from("teacher_assignments")
      .upsert(rows, { onConflict: "student_id,teacher_id,period_id", ignoreDuplicates: true })
      .select("id");

    if (!error) {
      totalAssigned += inserted?.length ?? 0;
      totalSkipped  += rows.length - (inserted?.length ?? 0);
    }
  }

  return NextResponse.json({
    assigned: totalAssigned,
    skipped:  totalSkipped,
    teachers: teacherCount,
  });
}
