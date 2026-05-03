import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClassManager from "@/components/admin/ClassManager";

export const revalidate = 0;

export default async function ClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  // Fetch classes with student count
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, academic_year")
    .order("academic_year", { ascending: false })
    .order("name");

  // Count students per class
  const { data: studentCounts } = await supabase
    .from("profiles")
    .select("class_id")
    .eq("role", "student")
    .not("class_id", "is", null);

  const countMap = new Map<string, number>();
  for (const s of studentCounts ?? []) {
    const cid = s.class_id as string;
    countMap.set(cid, (countMap.get(cid) ?? 0) + 1);
  }

  const enriched = (classes ?? []).map((c) => ({
    ...c,
    student_count: countMap.get(c.id) ?? 0,
  }));

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-primary">ห้องเรียน</h1>
        <p className="text-base-black/50 text-sm mt-1">จัดการห้องเรียนทั้งหมดในระบบ</p>
      </div>
      <ClassManager initialClasses={enriched} />
    </div>
  );
}
