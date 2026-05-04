import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import TeacherResultsChart from "@/components/teacher/TeacherResultsChart";
import YearSelector from "@/components/admin/YearSelector";
import type { TeacherResult, QuestionStat } from "@/lib/types/database.types";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, subject, employee_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "teacher") redirect("/login");

  // Get all available years from periods this teacher has results in
  const { data: allPeriods } = await supabase
    .from("evaluation_periods")
    .select("id, academic_year")
    .not("academic_year", "is", null);

  const allYears = Array.from(new Set((allPeriods ?? []).map((p) => p.academic_year as string)))
    .sort((a, b) => b.localeCompare(a));

  // Filter period IDs by year if selected
  let periodIds: string[] | null = null;
  if (year && allPeriods) {
    periodIds = allPeriods.filter((p) => p.academic_year === year).map((p) => p.id);
  }

  // Fetch results, filtered by period if year selected
  let resultsQuery = supabase
    .from("teacher_evaluation_results")
    .select("*")
    .eq("teacher_id", user.id);

  if (periodIds !== null) {
    if (periodIds.length === 0) {
      // No periods for this year → no results
      resultsQuery = resultsQuery.eq("period_id", "00000000-0000-0000-0000-000000000000");
    } else {
      resultsQuery = resultsQuery.in("period_id", periodIds);
    }
  }

  const { data: results } = await resultsQuery;
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
      stat.responses += 1;
      stat.average =
        stat.average === null
          ? r.rating_value
          : (stat.average * (stat.responses - 1) + r.rating_value) / stat.responses;
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
    <div className="min-h-screen bg-gray-50">
      <Navbar profile={{ full_name: profile.full_name, role: "teacher", avatar_url: profile.avatar_url }} />

      <main className="page-container">
        {/* Header */}
        <section className="mb-8 animate-fade-in">
          <div className="card bg-gradient-to-br from-primary to-primary/80 text-base-white relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-base-white/5 rounded-full" />
            <div className="relative z-10">
              <p className="text-base-white/60 text-sm mb-1">ผลการประเมินของคุณ</p>
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <p className="text-accent text-sm mt-0.5">{profile.subject}</p>
            </div>
            <div className="relative z-10 mt-4">
              <Link
                href="/teacher/report"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-base-white/15 hover:bg-base-white/25 text-base-white text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                พิมพ์ / บันทึก PDF
              </Link>
            </div>
          </div>
        </section>

        {/* Year filter */}
        {allYears.length > 0 && (
          <div className="mb-6 animate-fade-in">
            <YearSelector years={allYears} currentYear={year ?? ""} basePath="/teacher" />
          </div>
        )}

        {/* Summary stats */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 animate-slide-up">
          <div className="card text-center">
            <div className="text-3xl font-black text-primary mb-1">
              {overallAvg !== null ? overallAvg.toFixed(2) : "—"}
            </div>
            <div className="text-xs text-base-black/50 font-medium">คะแนนเฉลี่ย / 5.00</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-black text-primary mb-1">{totalRespondents}</div>
            <div className="text-xs text-base-black/50 font-medium">ผู้ประเมิน</div>
          </div>
          <div className="card text-center col-span-2 sm:col-span-1">
            <div className="text-3xl font-black text-accent mb-1">{textComments.length}</div>
            <div className="text-xs text-base-black/50 font-medium">ความคิดเห็น</div>
          </div>
        </section>

        {/* Chart */}
        {ratingStats.length > 0 && (
          <section className="card mb-8 animate-slide-up">
            <h2 className="text-base font-bold text-primary mb-6">คะแนนแต่ละด้าน</h2>
            <TeacherResultsChart stats={ratingStats} />
          </section>
        )}

        {/* Text comments (anonymous) */}
        {textComments.length > 0 && (
          <section className="animate-slide-up">
            <h2 className="text-base font-bold text-primary mb-4">
              ข้อเสนอแนะ
              <span className="ml-2 text-xs font-normal text-base-black/40 bg-gray-100 px-2 py-0.5 rounded-full">
                ไม่ระบุตัวตน
              </span>
            </h2>
            <div className="flex flex-col gap-3">
              {textComments.map((comment, i) => (
                <div key={i} className="card !p-4 flex gap-3">
                  <div className="w-7 h-7 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-primary/60" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-base-black/70 leading-relaxed">{comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {typedResults.length === 0 && (
          <div className="card flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 bg-primary/8 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h3 className="font-semibold text-primary text-base mb-1">ยังไม่มีผลประเมิน</h3>
            <p className="text-base-black/50 text-sm">{year ? `ไม่มีข้อมูลในปีการศึกษา ${year}` : "รอให้นักเรียนส่งการประเมิน"}</p>
          </div>
        )}
      </main>
    </div>
  );
}
