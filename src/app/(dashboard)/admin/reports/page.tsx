import { createClient } from "@/lib/supabase/server";
import ReportsDashboard from "@/components/admin/reports/ReportsDashboard";

export const revalidate = 60;

export default async function ReportsPage() {
  const supabase = await createClient();

  // Fetch all raw data in parallel — joined in client
  const [
    { data: assignments },
    { data: submissions },
    { data: responses },
    { data: questions },
    { data: profiles },
    { data: classes },
  ] = await Promise.all([
    supabase.from("teacher_assignments").select("id, student_id, teacher_id, class_id"),
    supabase.from("evaluation_submissions").select("id, assignment_id, student_id, teacher_id, is_submitted, submitted_at").eq("is_submitted", true),
    supabase.from("evaluation_responses").select("id, submission_id, question_id, rating_value, text_value"),
    supabase.from("evaluation_questions").select("id, question_text, question_type, order_index").order("order_index"),
    supabase.from("profiles").select("id, full_name, subject, employee_id, student_number, role, avatar_url"),
    supabase.from("classes").select("id, name, academic_year"),
  ]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-primary">รายงานและวิเคราะห์</h1>
        <p className="text-base-black/50 text-sm mt-1">ภาพรวมผลการประเมินเชิงลึก</p>
      </div>

      <ReportsDashboard
        assignments={assignments ?? []}
        submissions={submissions ?? []}
        responses={responses ?? []}
        questions={questions ?? []}
        profiles={profiles ?? []}
        classes={classes ?? []}
      />
    </div>
  );
}
