import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import TeacherEvalCard from "@/components/student/TeacherEvalCard";
import YearSelector from "@/components/admin/YearSelector";
import type { AssignmentWithTeacher } from "@/lib/types/database.types";

export const revalidate = 0;

export default async function StudentDashboard({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, student_number")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "student") redirect("/login");

  const { data: settings } = await supabase.from("system_settings").select("key,value");
  const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  const evaluationsEnabled = settingsMap["evaluations_enabled"] !== "false";
  const shutdownMessage = settingsMap["shutdown_message"] ?? "ระบบปิดชั่วคราว กรุณาติดต่อผู้ดูแลระบบ";

  // Get all available years from periods
  const { data: allPeriods } = await supabase
    .from("evaluation_periods")
    .select("id, academic_year")
    .not("academic_year", "is", null);

  const allYears = Array.from(new Set((allPeriods ?? []).map((p) => p.academic_year as string)))
    .sort((a, b) => b.localeCompare(a));

  // Filter period IDs by year if selected
  let periodFilter: string[] | null = null;
  if (year && allPeriods) {
    periodFilter = allPeriods.filter((p) => p.academic_year === year).map((p) => p.id);
  }

  // Fetch assignments
  let assignmentsQuery = supabase
    .from("teacher_assignments")
    .select(`
      id, student_id, teacher_id, form_id, period_id, class_id, created_at,
      teacher:profiles!teacher_assignments_teacher_id_fkey (id, full_name, subject, employee_id, avatar_url),
      form:evaluation_forms!teacher_assignments_form_id_fkey (id, title, academic_year),
      period:evaluation_periods!teacher_assignments_period_id_fkey (id, title, start_at, end_at),
      submission:evaluation_submissions (id, is_submitted, submitted_at)
    `)
    .eq("student_id", user.id)
    .order("created_at", { ascending: true });

  if (periodFilter !== null) {
    if (periodFilter.length === 0) {
      assignmentsQuery = assignmentsQuery.eq("period_id", "00000000-0000-0000-0000-000000000000");
    } else {
      assignmentsQuery = assignmentsQuery.in("period_id", periodFilter);
    }
  }

  const { data: assignments } = await assignmentsQuery;

  const typedAssignments = (assignments ?? []) as unknown as AssignmentWithTeacher[];
  const total = typedAssignments.length;
  const completed = typedAssignments.filter((a) => {
    const sub = Array.isArray(a.submission) ? a.submission[0] ?? null : a.submission;
    return sub?.is_submitted;
  }).length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar profile={{ full_name: profile.full_name, role: "student", avatar_url: profile.avatar_url }} />

      <main className="page-container">
        {/* Welcome header */}
        <section className="mb-8 animate-fade-in">
          <div className="card bg-gradient-to-br from-primary to-primary/80 text-base-white overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-base-white/5 rounded-full" />
            <div className="absolute -bottom-16 -left-8 w-64 h-64 bg-base-white/5 rounded-full" />
            <div className="relative z-10">
              <p className="text-base-white/60 text-sm font-medium mb-1">สวัสดี</p>
              <h1 className="text-2xl font-bold mb-1">{profile.full_name}</h1>
              <p className="text-base-white/70 text-sm">รหัสนักเรียน: {profile.student_number ?? "—"}</p>
            </div>
          </div>
        </section>

        {/* Year filter */}
        {allYears.length > 0 && (
          <div className="mb-6 animate-fade-in">
            <YearSelector years={allYears} currentYear={year ?? ""} basePath="/student" />
          </div>
        )}

        {/* Progress summary */}
        <section className="mb-8 animate-fade-in">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-primary">ความคืบหน้าการประเมิน</h2>
                <p className="text-base-black/50 text-sm mt-0.5">{completed} / {total} รายวิชาที่ประเมินแล้ว</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-primary">{progressPct}%</span>
              </div>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-700 ease-out" style={{ width: `${progressPct}%` }} />
            </div>
            {progressPct === 100 && total > 0 && (
              <p className="mt-3 text-sm text-green-600 font-semibold flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                ประเมินครบทุกรายวิชาแล้ว ขอบคุณ!
              </p>
            )}
          </div>
        </section>

        {/* Shutdown banner */}
        {!evaluationsEnabled && (
          <section className="mb-6 animate-fade-in">
            <div className="rounded-2xl bg-red-50 border-2 border-red-300 px-5 py-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="font-bold text-red-700 text-sm">ระบบประเมินถูกปิดชั่วคราว</p>
                <p className="text-red-600 text-sm mt-0.5">{shutdownMessage}</p>
              </div>
            </div>
          </section>
        )}

        {/* Teacher cards grid */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-primary">รายการครูที่ต้องประเมิน</h2>
            <span className="text-sm text-base-black/40">{total} รายการ</span>
          </div>

          {total === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-primary/8 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
              </div>
              <h3 className="font-semibold text-primary text-base mb-1">ยังไม่มีรายการประเมิน</h3>
              <p className="text-base-black/50 text-sm max-w-xs">
                {year ? `ไม่มีรายการในปีการศึกษา ${year}` : "กรุณาติดต่อผู้ดูแลระบบหากคุณควรจะมีรายการประเมิน"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {typedAssignments.map((assignment) => (
                <TeacherEvalCard key={assignment.id} assignment={assignment} systemEnabled={evaluationsEnabled} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
