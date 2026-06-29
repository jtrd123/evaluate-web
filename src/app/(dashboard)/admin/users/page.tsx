import { createClient as createAdminClient } from "@supabase/supabase-js";
import UserManager from "@/components/admin/UserManager";

export const dynamic = "force-dynamic";

function adminSupa() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function UsersPage() {
  const supa = adminSupa();

  // Fetch all auth users to get emails (paginate to handle >1000 users)
  const allAuthUsers: { id: string; email?: string }[] = [];
  let page = 1;
  while (true) {
    const { data: authList } = await supa.auth.admin.listUsers({ perPage: 1000, page });
    const users = authList?.users ?? [];
    allAuthUsers.push(...users);
    if (users.length < 1000) break;
    page++;
  }
  const emailMap = new Map(allAuthUsers.map((u) => [u.id, u.email ?? ""]));

  // Paginate teachers (usually <1000 but safe)
  const teacherRows: Record<string, unknown>[] = [];
  {
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data } = await supa.from("profiles")
        .select("id, full_name, employee_id, subject, teaching_levels, academic_year, role")
        .in("role", ["teacher", "admin"])
        .order("full_name")
        .range(from, from + PAGE - 1);
      teacherRows.push(...((data ?? []) as Record<string, unknown>[]));
      if ((data?.length ?? 0) < PAGE) break;
      from += PAGE;
    }
  }

  // Paginate students (can exceed 1000)
  const studentRows: Record<string, unknown>[] = [];
  {
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data } = await supa.from("profiles")
        .select("id, full_name, student_number, class_id, classes(name, academic_year)")
        .eq("role", "student")
        .order("full_name")
        .range(from, from + PAGE - 1);
      studentRows.push(...((data ?? []) as Record<string, unknown>[]));
      if ((data?.length ?? 0) < PAGE) break;
      from += PAGE;
    }
  }

  const { data: classes } = await supa.from("classes")
    .select("id, name, academic_year")
    .order("academic_year", { ascending: false })
    .order("name");

  const teacherList = teacherRows.map((t) => ({
    id: t.id as string,
    full_name: t.full_name as string,
    email: emailMap.get(t.id as string) ?? "",
    employee_id: (t.employee_id as string | null) ?? null,
    subject: (t.subject as string | null) ?? null,
    teaching_levels: (t.teaching_levels as string | null) ?? null,
    academic_year: (t.academic_year as string | null) ?? null,
    role: ((t.role as string) ?? "teacher") as "admin" | "teacher" | "student",
  }));

  const studentList = studentRows.map((s) => {
    const cls = s.classes as { name: string; academic_year: string } | null;
    return {
      id: s.id as string,
      full_name: s.full_name as string,
      email: emailMap.get(s.id as string) ?? "",
      student_number: (s.student_number as string | null) ?? null,
      class_id: (s.class_id as string | null) ?? null,
      class_name: cls?.name ?? null,
      class_year: cls?.academic_year ?? null,
    };
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-primary">ผู้ใช้งาน</h1>
        <p className="text-base-black/50 text-sm mt-1">จัดการข้อมูลครูและนักเรียน แก้ไขข้อมูล รีเซ็ตรหัสผ่าน</p>
      </div>
      <UserManager
        teachers={teacherList}
        students={studentList}
        classes={classes ?? []}
      />
    </div>
  );
}
