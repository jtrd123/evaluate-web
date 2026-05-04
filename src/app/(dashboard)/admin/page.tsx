import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "@/components/admin/AdminDashboard";
import EmergencyShutdown from "@/components/admin/EmergencyShutdown";
import Link from "next/link";

export const revalidate = 30;

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { data: submissions },
    { data: assignments },
    { data: settings },
    { count: classesCount },
    { count: teachersCount },
    { count: studentsCount },
    { count: formsCount },
    { count: assignmentsCount },
  ] = await Promise.all([
    supabase
      .from("evaluation_submissions")
      .select(`
        id, is_submitted, submitted_at,
        student:profiles!evaluation_submissions_student_id_fkey (full_name, student_number),
        teacher:profiles!evaluation_submissions_teacher_id_fkey (full_name, employee_id),
        period:evaluation_periods!evaluation_submissions_period_id_fkey (title, end_at)
      `)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("teacher_assignments")
      .select(`
        id,
        student:profiles!teacher_assignments_student_id_fkey (full_name, student_number),
        teacher:profiles!teacher_assignments_teacher_id_fkey (full_name, employee_id)
      `),
    supabase.from("system_settings").select("key,value"),
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("evaluation_forms").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("teacher_assignments").select("id", { count: "exact", head: true }),
  ]);

  const total = assignments?.length ?? 0;
  const done = submissions?.filter((s) => s.is_submitted).length ?? 0;

  const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  const evaluationsEnabled = settingsMap["evaluations_enabled"] !== "false";
  const shutdownMessage = settingsMap["shutdown_message"] ?? "ระบบปิดชั่วคราว กรุณาติดต่อผู้ดูแลระบบ";

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
    <div>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-black text-primary">แดชบอร์ดผู้ดูแลระบบ</h1>
        <p className="text-base-black/50 text-sm mt-1">ภาพรวมการประเมินทั้งหมด</p>
      </div>

      {/* Getting Started Checklist */}
      {allDone ? (
        <div className="card mb-8 animate-slide-up flex items-center gap-3 bg-green-50 border border-green-200">
          <span className="text-2xl">✨</span>
          <p className="font-bold text-green-700">ตั้งค่าครบแล้ว พร้อมใช้งาน</p>
        </div>
      ) : (
        <div className="card mb-8 animate-slide-up">
          <h2 className="font-bold text-base-black mb-4 flex items-center gap-2">
            <span>📋</span>
            <span>ขั้นตอนการตั้งค่าระบบ</span>
          </h2>
          <div className="space-y-2">
            {checklistSteps.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${step.done ? "bg-green-50" : "bg-gray-50"}`}>
                <span className="text-lg shrink-0">{step.done ? "✅" : "⭕"}</span>
                <span className={`flex-1 text-sm font-medium ${step.done ? "text-green-700 line-through decoration-green-400" : "text-base-black/70"}`}>
                  {i + 1}. {step.label}
                </span>
                {!step.done && (
                  <Link
                    href={step.href}
                    className="text-xs font-bold text-primary hover:text-primary/80 shrink-0 px-2.5 py-1 rounded-lg bg-primary/8 hover:bg-primary/15 transition-colors"
                  >
                    → ทำเลย
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-slide-up">
        {[
          { label: "การมอบหมายทั้งหมด", value: total, color: "text-primary" },
          { label: "ส่งแล้ว", value: done, color: "text-green-600" },
          { label: "ยังไม่ส่ง", value: total - done, color: "text-amber-600" },
          { label: "% สำเร็จ", value: total > 0 ? `${Math.round((done / total) * 100)}%` : "—", color: "text-primary" },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-base-black/50">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Emergency Shutdown */}
      <div className="mb-8">
        <EmergencyShutdown
          initialEnabled={evaluationsEnabled}
          initialMessage={shutdownMessage}
        />
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AdminDashboard submissions={(submissions ?? []) as any} />
    </div>
  );
}
