import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import TeacherResultsChart from "@/components/teacher/TeacherResultsChart";
import YearSelector from "@/components/admin/YearSelector";
import ClassSelector from "@/components/teacher/ClassSelector";
import type { TeacherResult, QuestionStat } from "@/lib/types/database.types";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; classId?: string }>;
}) {
  const { year, classId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, subject, employee_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "teacher") redirect("/login");

  // ── Periods for year filter ──────────────────────────────────────────────
  const { data: allPeriods } = await supabase
    .from("evaluation_periods")
    .select("id, academic_year")
    .not("academic_year", "is", null);

  const allYears = Array.from(new Set((allPeriods ?? []).map((p) => p.academic_year as string)))
    .sort((a, b) => b.localeCompare(a));

  let periodIds: string[] | null = null;
  if (year && allPeriods) {
    periodIds = allPeriods.filter((p) => p.academic_year === year).map((p) => p.id);
  }

  // ── All assignments for this teacher ────────────────────────────────────
  const { data: assignmentsRaw } = await supabase
    .from("teacher_assignments")
    .select("id, class_id, period_id, form_id")
    .eq("teacher_id", user.id);

  // Build class list for selector
  const rawClassIds = [...new Set((assignmentsRaw ?? []).map((a) => a.class_id).filter(Boolean) as string[])];
  let teacherClasses: Array<{ id: string; name: string; academic_year: string }> = [];
  if (rawClassIds.length > 0) {
    const { data: classData } = await supabase
      .from("classes")
      .select("id, name, academic_year")
      .in("id", rawClassIds)
      .order("name");
    teacherClasses = classData ?? [];
  }

  // ── Apply year + class filters ───────────────────────────────────────────
  let filteredAssignments = assignmentsRaw ?? [];
  if (classId) {
    filteredAssignments = filteredAssignments.filter((a) => a.class_id === classId);
  }
  if (periodIds !== null) {
    filteredAssignments = periodIds.length === 0
      ? []
      : filteredAssignments.filter((a) => periodIds!.includes(a.period_id ?? ""));
  }
  const filteredAssignmentIds = filteredAssignments.map((a) => a.id);

  // ── Fetch responses for filtered assignments ──────────────────────────────
  let typedResults: TeacherResult[] = [];
  let classStats: Array<{ classId: string; className: string; average: number; respondents: number }> = [];

  if (filteredAssignmentIds.length > 0) {
    const { data: subsData } = await supabase
      .from("evaluation_submissions")
      .select("id, submitted_at, assignment_id")
      .in("assignment_id", filteredAssignmentIds)
      .eq("is_submitted", true);

    const subIds = (subsData ?? []).map((s) => s.id);

    if (subIds.length > 0) {
      const formIds = [...new Set(filteredAssignments.map((a) => a.form_id).filter(Boolean) as string[])];
      const [{ data: responsesData }, { data: questionsData }] = await Promise.all([
        supabase.from("evaluation_responses")
          .select("submission_id, question_id, rating_value, text_value")
          .in("submission_id", subIds),
        supabase.from("evaluation_questions")
          .select("id, question_text, question_type, order_index")
          .in("form_id", formIds)
          .order("order_index"),
      ]);

      // ── Compute per-class stats (for comparison table) ─────────────────────
      if (!classId && teacherClasses.length > 1) {
        const assignmentClassMap = new Map(filteredAssignments.map((a) => [a.id, a.class_id]));
        const subClassMap = new Map((subsData ?? []).map((s) => [s.id, assignmentClassMap.get(s.assignment_id) ?? null]));

        const classRatingMap = new Map<string, { sum: number; count: number; respondents: Set<string> }>();
        for (const r of responsesData ?? []) {
          if (r.rating_value === null) continue;
          const cid = subClassMap.get(r.submission_id);
          const key = cid ?? "__none__";
          const cur = classRatingMap.get(key) ?? { sum: 0, count: 0, respondents: new Set<string>() };
          cur.sum += r.rating_value;
          cur.count++;
          cur.respondents.add(r.submission_id);
          classRatingMap.set(key, cur);
        }

        classStats = Array.from(classRatingMap.entries())
          .map(([cid, { sum, count, respondents }]) => {
            const cls = teacherClasses.find((c) => c.id === cid);
            return {
              classId: cid,
              className: cls?.name ?? "ไม่ระบุ",
              average: count > 0 ? sum / count : 0,
              respondents: respondents.size,
            };
          })
          .sort((a, b) => b.average - a.average);
      }

      const questionMap = new Map((questionsData ?? []).map((q) => [q.id, q]));
      const submissionMap = new Map((subsData ?? []).map((s) => [s.id, s]));

      typedResults = ((responsesData ?? []).map((r) => {
        const q = questionMap.get(r.question_id);
        const sub = submissionMap.get(r.submission_id);
        if (!q) return null;
        return {
          question_id: r.question_id,
          question_text: q.question_text,
          question_type: q.question_type,
          order_index: q.order_index,
          rating_value: r.rating_value,
          text_value: r.text_value,
          teacher_id: user.id,
          submitted_at: sub?.submitted_at ?? "",
          period_id: "",
        } as TeacherResult;
      }).filter(Boolean)) as TeacherResult[];
    }
  }

  // ── Aggregate stats ──────────────────────────────────────────────────────
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
              <Link href="/teacher/report"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-base-white/15 hover:bg-base-white/25 text-base-white text-sm font-semibold transition-colors">
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
          <div className="mb-4 animate-fade-in">
            <YearSelector years={allYears} currentYear={year ?? ""} basePath="/teacher" />
          </div>
        )}

        {/* Class filter */}
        {teacherClasses.length > 1 && (
          <div className="mb-6 animate-fade-in">
            <p className="text-xs font-semibold text-base-black/50 mb-2">กรองตามชั้น</p>
            <ClassSelector classes={teacherClasses} currentClassId={classId ?? ""} />
          </div>
        )}

        {/* Class comparison table */}
        {teacherClasses.length > 1 && !classId && classStats.length > 0 && (
          <section className="card mb-6 animate-slide-up">
            <h2 className="text-base font-bold text-primary mb-4">คะแนนแยกตามชั้นเรียน</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-base-black/40">ห้อง</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-base-black/40">คะแนนเฉลี่ย</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-base-black/40">ผู้ประเมิน</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-base-black/40 w-44 hidden sm:table-cell">กราฟ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {classStats.map((cs, i) => (
                    <tr key={cs.classId} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/teacher?classId=${cs.classId}${year ? `&year=${year}` : ""}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {cs.className}
                        </Link>
                        {i === 0 && classStats.length > 1 && (
                          <span className="ml-2 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full font-semibold">สูงสุด</span>
                        )}
                        {i === classStats.length - 1 && classStats.length > 1 && (
                          <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-semibold">ต่ำสุด</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center font-bold text-primary">{cs.average.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-center text-base-black/50">{cs.respondents} คน</td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min((cs.average / 5) * 100, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-base-black/40 mt-3">คลิกชื่อห้องเพื่อดูรายละเอียดของแต่ละชั้น</p>
          </section>
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

        {/* Text comments */}
        {textComments.length > 0 && (
          <section className="animate-slide-up">
            <h2 className="text-base font-bold text-primary mb-4">
              ข้อเสนอแนะ
              <span className="ml-2 text-xs font-normal text-base-black/40 bg-gray-100 px-2 py-0.5 rounded-full">ไม่ระบุตัวตน</span>
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
            <p className="text-base-black/50 text-sm">
              {year ? `ไม่มีข้อมูลในปีการศึกษา ${year}` : classId ? "ไม่มีข้อมูลสำหรับชั้นนี้" : "รอให้นักเรียนส่งการประเมิน"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
