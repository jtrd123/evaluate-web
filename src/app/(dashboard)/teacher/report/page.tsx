import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrintReportClient from "@/components/teacher/PrintReportClient";
import type { TeacherResult, QuestionStat } from "@/lib/types/database.types";

export const revalidate = 60;

export default async function TeacherReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, subject, employee_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "teacher") redirect("/login");

  const { data: results } = await supabase
    .from("teacher_evaluation_results")
    .select("*")
    .eq("teacher_id", user.id);

  const typedResults = (results ?? []) as TeacherResult[];

  const statsMap = new Map<string, QuestionStat>();
  for (const r of typedResults) {
    if (!statsMap.has(r.question_id)) {
      statsMap.set(r.question_id, {
        question_id: r.question_id,
        question_text: r.question_text,
        question_type: r.question_type,
        order_index: r.order_index,
        average: null,
        responses: 0,
      });
    }
    const stat = statsMap.get(r.question_id)!;
    if (r.question_type === "rating" && r.rating_value) {
      const prev = stat.responses;
      stat.responses += 1;
      stat.average =
        stat.average === null
          ? r.rating_value
          : (stat.average * prev + r.rating_value) / stat.responses;
    } else if (r.question_type === "text" && r.text_value) {
      stat.responses += 1;
    }
  }

  const stats = Array.from(statsMap.values()).sort((a, b) => a.order_index - b.order_index);
  const ratingStats = stats.filter((s) => s.question_type === "rating");
  const textComments = typedResults
    .filter((r) => r.question_type === "text" && r.text_value?.trim())
    .map((r) => r.text_value as string);

  const overallAvg =
    ratingStats.length > 0
      ? ratingStats.reduce((sum, s) => sum + (s.average ?? 0), 0) / ratingStats.length
      : null;

  const totalRespondents = typedResults.length > 0
    ? new Set(typedResults.map((r) => r.submitted_at)).size
    : 0;

  return (
    <PrintReportClient
      profile={profile}
      ratingStats={ratingStats}
      textComments={textComments}
      overallAvg={overallAvg}
      totalRespondents={totalRespondents}
      printDate={new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
    />
  );
}
