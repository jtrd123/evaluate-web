import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "@/components/admin/AdminDashboard";
import EmergencyShutdown from "@/components/admin/EmergencyShutdown";
import Link from "next/link";

export const revalidate = 30;

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { data: assignmentsRaw },
    { data: submissionsRaw },
    { data: recentRaw },
    { data: settings },
    { count: classesCount },
    { count: teachersCount },
    { count: studentsCount },
    { count: formsCount },
    { count: assignmentsCount },
  ] = await Promise.all([
    // All assignments with student class info (for class completion)
    supabase.from("teacher_assignments").select(`
      id,
      student:profiles!teacher_assignments_student_id_fkey (
        class_id, classes(name, academic_year)
      )
    `),
    // All submission statuses
    supabase.from("evaluation_submissions").select("assignment_id, is_submitted"),
    // Recent 8 submitted (activity feed)
    supabase.from("evaluation_submissions")
      .select(`
        id, submitted_at,
        teacher:profiles!evaluation_submissions_teacher_id_fkey (full_name, employee_id),
        period:evaluation_periods!evaluation_submissions_period_id_fkey (title)
      `)
      .eq("is_submitted", true)
      .order("submitted_at", { ascending: false })
      .limit(8),
    supabase.from("system_settings").select("key,value"),
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("evaluation_forms").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("teacher_assignments").select("id", { count: "exact", head: true }),
  ]);

  // ── Compute class completion ───────────────────────────────────────────────
  const submissionMap = new Map(
    (submissionsRaw ?? []).map((s) => [s.assignment_id, s.is_submitted])
  );

  type ClassEntry = { name: string; year: string; total: number; done: number };
  const classMap = new Map<string, ClassEntry>();

  for (const a of assignmentsRaw ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cls = (a.student as any)?.classes as { name: string; academic_year: string } | null;
    if (!cls) continue;
    const key = `${cls.name}|${cls.academic_year}`;
    if (!classMap.has(key)) {
      classMap.set(key, { name: cls.name, year: cls.academic_year, total: 0, done: 0 });
    }
    const entry = classMap.get(key)!;
    entry.total++;
    if (submissionMap.get(a.id)) entry.done++;
  }

  const classSummary = Array.from(classMap.values())
    .sort((a, b) => (a.done / a.total || 0) - (b.done / b.total || 0));

  // ── Settings ───────────────────────────────────────────────────────────────
  const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  const evaluationsEnabled = settingsMap["evaluations_enabled"] !== "false";
  const shutdownMessage = settingsMap["shutdown_message"] ?? "ระบบปิดชั่วคราว กรุณาติดต่อผู้ดูแลระบบ";

  const total = assignmentsCount ?? 0;
  const done = (submissionsRaw ?? []).filter((s) => s.is_submitted).length;

  // ── Setup checklist ────────────────────────────────────────────────────────
  const hasClasses = (classesCount ?? 0) > 0;
  const hasTeachers = (teachersCount ?? 0) > 0;
  const hasStudents = (studentsCount ?? 0) > 0;
  const hasForms = (formsCount ?? 0) > 0;
  const hasAssignments = (assignmentsCount ?? 0) > 0;
  const allDone = hasClasses && hasTeachers && hasStudents && hasForms && hasAssignments;

  const checklistSteps = [
    { label: "สร้างห้องเรียน", done: hasClasses, href: "/admin/classes" },
    { label: "นำเข้ารายชื่อครู", done: hasTeachers, href: "/admin/import" },
    { label: "นำเข้ารายชื่อนักเรียน", done: hasStudents, href: "/admin/import" },
    { label: "สร้างแบบฟอร์มประเมิน", done: hasForms, href: "/admin/forms" },
    { label: "จับคู่ครู-นักเรียน", done: hasAssignments, href: "/admin/assignments" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-primary">แดชบอร์ด</h1>
        <p className="text-base-black/50 text-sm mt-1">ภาพรวมการประเมินทั้งหมด</p>
      </div>

      {/* Setup checklist */}
      {!allDone && (
        <div className="card animate-slide-up">
          <h2 className="font-bold text-base-black mb-4 flex items-center gap-2">
            <span>📋</span> ขั้นตอนการตั้งค่าระบบ
          </h2>
          <div className="space-y-2">
            {checklistSteps.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${step.done ? "bg-green-50" : "bg-gray-50"}`}>
                <span className="text-lg shrink-0">{step.done ? "✅" : "⭕"}</span>
                <span className={`flex-1 text-sm font-medium ${step.done ? "text-green-700 line-through decoration-green-400" : "text-base-black/70"}`}>
                  {i + 1}. {step.label}
                </span>
                {!step.done && (
                  <Link href={step.href} className="text-xs font-bold text-primary px-2.5 py-1 rounded-lg bg-primary/8 hover:bg-primary/15 transition-colors">
                    → ทำเลย
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "มอบหมายทั้งหมด", value: total, color: "text-primary" },
          { label: "ส่งแล้ว", value: done, color: "text-green-600" },
          { label: "ยังไม่ส่ง", value: total - done, color: "text-amber-600" },
          {
            label: "% สำเร็จ",
            value: total > 0 ? `${Math.round((done / total) * 100)}%` : "—",
            color: total > 0 && done / total >= 0.8 ? "text-green-600" : "text-primary",
          },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-base-black/50">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Emergency control + Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AdminDashboard
            classSummary={classSummary}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recentActivity={(recentRaw ?? []) as any}
          />
        </div>
        <div>
          <EmergencyShutdown
            initialEnabled={evaluationsEnabled}
            initialMessage={shutdownMessage}
          />
        </div>
      </div>
    </div>
  );
}
