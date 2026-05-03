import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "@/components/admin/AdminDashboard";
import EmergencyShutdown from "@/components/admin/EmergencyShutdown";

export const revalidate = 30;

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: submissions }, { data: assignments }, { data: settings }] = await Promise.all([
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
  ]);

  const total = assignments?.length ?? 0;
  const done = submissions?.filter((s) => s.is_submitted).length ?? 0;

  const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  const evaluationsEnabled = settingsMap["evaluations_enabled"] !== "false";
  const shutdownMessage = settingsMap["shutdown_message"] ?? "ระบบปิดชั่วคราว กรุณาติดต่อผู้ดูแลระบบ";

  return (
    <div>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-black text-primary">แดชบอร์ดผู้ดูแลระบบ</h1>
        <p className="text-base-black/50 text-sm mt-1">ภาพรวมการประเมินทั้งหมด</p>
      </div>

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
