import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import UserManager from "@/components/admin/UserManager";

export const revalidate = 0;

function adminSupa() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const supa = adminSupa();

  // Fetch all auth users to get emails
  const { data: authList } = await supa.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map((authList?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  const [{ data: teachers }, { data: students }, { data: classes }] = await Promise.all([
    supa.from("profiles")
      .select("id, full_name, employee_id, subject, teaching_levels")
      .eq("role", "teacher")
      .order("full_name"),
    supa.from("profiles")
      .select("id, full_name, student_number, class_id, classes(name, academic_year)")
      .eq("role", "student")
      .order("full_name"),
    supa.from("classes").select("id, name, academic_year").order("academic_year", { ascending: false }).order("name"),
  ]);

  const teacherList = (teachers ?? []).map((t) => ({
    id: t.id,
    full_name: t.full_name,
    email: emailMap.get(t.id) ?? "",
    employee_id: t.employee_id ?? null,
    subject: t.subject ?? null,
    teaching_levels: (t as Record<string, unknown>).teaching_levels as string | null ?? null,
  }));

  const studentList = (students ?? []).map((s) => {
    const cls = (s as Record<string, unknown>).classes as { name: string; academic_year: string } | null;
    return {
      id: s.id,
      full_name: s.full_name,
      email: emailMap.get(s.id) ?? "",
      student_number: s.student_number ?? null,
      class_id: s.class_id ?? null,
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
