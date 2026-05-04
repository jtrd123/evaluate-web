"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import type { QuestionAvg, RawProfile, RawResponse, RawQuestion, RawSubmission } from "./ReportsDashboard";

interface Props {
  questionAverages: QuestionAvg[];
  teachers: RawProfile[];
  responses: RawResponse[];
  questions: RawQuestion[];
  submissions: RawSubmission[];
}

function ScoreChip({ value }: { value: number }) {
  const color = value >= 4 ? "bg-green-100 text-green-700" : value >= 3 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color}`}>{value.toFixed(2)}</span>;
}

export default function QuestionAnalysisReport({ questionAverages, teachers, responses, questions, submissions }: Props) {
  const [selectedTeacher, setSelectedTeacher] = useState<string>("__all__");
  const [viewMode, setViewMode] = useState<"overview" | "teachers">("overview");

  const subMap = useMemo(() => new Map(submissions.map((s) => [s.id, s])), [submissions]);
  const qMap = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);

  // Per-teacher scores for cards view
  const teacherCards = useMemo(() => {
    const acc = new Map<string, { sum: number; count: number; respondents: Set<string> }>();
    for (const r of responses) {
      if (r.rating_value === null) continue;
      const sub = subMap.get(r.submission_id);
      if (!sub) continue;
      const q = qMap.get(r.question_id);
      if (!q || q.question_type !== "rating") continue;
      const cur = acc.get(sub.teacher_id) ?? { sum: 0, count: 0, respondents: new Set<string>() };
      cur.sum += r.rating_value;
      cur.count++;
      cur.respondents.add(sub.student_id);
      acc.set(sub.teacher_id, cur);
    }
    return teachers
      .map((t) => {
        const a = acc.get(t.id);
        return { teacher: t, average: a ? parseFloat((a.sum / a.count).toFixed(2)) : 0, respondents: a?.respondents.size ?? 0 };
      })
      .filter((t) => t.respondents > 0)
      .sort((a, b) => b.average - a.average);
  }, [responses, submissions, teachers, subMap, qMap]);

  // Group by subject
  const bySubject = useMemo(() => {
    const groups = new Map<string, typeof teacherCards>();
    for (const ts of teacherCards) {
      const subj = ts.teacher.subject?.trim() || "ไม่ระบุกลุ่มสาระ";
      const arr = groups.get(subj) ?? [];
      arr.push(ts);
      groups.set(subj, arr);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === "ไม่ระบุกลุ่มสาระ") return 1;
      if (b === "ไม่ระบุกลุ่มสาระ") return -1;
      return a.localeCompare(b, "th");
    });
  }, [teacherCards]);

  // Recompute averages per question when teacher filter changes
  const filteredAverages = useMemo<QuestionAvg[]>(() => {
    if (selectedTeacher === "__all__") return questionAverages;
    const acc = new Map<string, { sum: number; count: number }>();
    for (const r of responses) {
      if (r.rating_value === null) continue;
      const sub = subMap.get(r.submission_id);
      if (!sub || sub.teacher_id !== selectedTeacher) continue;
      const q = qMap.get(r.question_id);
      if (!q || q.question_type !== "rating") continue;
      const cur = acc.get(r.question_id) ?? { sum: 0, count: 0 };
      cur.sum += r.rating_value;
      cur.count++;
      acc.set(r.question_id, cur);
    }
    return questions
      .filter((q) => q.question_type === "rating")
      .map((q) => {
        const a = acc.get(q.id);
        return { questionId: q.id, questionText: q.question_text, orderIndex: q.order_index, average: a ? parseFloat((a.sum / a.count).toFixed(2)) : 0, count: a?.count ?? 0 };
      })
      .filter((q) => q.count > 0)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [selectedTeacher, questionAverages, responses, subMap, qMap, questions]);

  const chartData = filteredAverages.map((q, i) => ({ name: `ข้อ ${i + 1}`, fullText: q.questionText, value: q.average, count: q.count }));
  const overallAvg = filteredAverages.length > 0 ? (filteredAverages.reduce((s, q) => s + q.average, 0) / filteredAverages.length).toFixed(2) : "—";
  const weakest = [...filteredAverages].sort((a, b) => a.average - b.average)[0];
  const strongest = [...filteredAverages].sort((a, b) => b.average - a.average)[0];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* View mode toggle */}
      <div className="flex gap-2">
        {(["overview", "teachers"] as const).map((m) => (
          <button key={m} onClick={() => setViewMode(m)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              viewMode === m ? "bg-primary text-white shadow-sm" : "bg-white border border-gray-200 text-base-black/60 hover:border-primary/30"
            }`}
          >
            {m === "overview" ? "📊 ภาพรวม" : "👥 รายครู"}
          </button>
        ))}
      </div>

      {/* ── TEACHERS CARDS VIEW ─────────────────────────────────────────────── */}
      {viewMode === "teachers" && (
        <div className="flex flex-col gap-8">
          {teacherCards.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-center">
              <p className="text-base-black/40 text-sm">ยังไม่มีข้อมูลคะแนน</p>
            </div>
          ) : bySubject.map(([subject, cards]) => (
            <div key={subject}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-xs font-bold text-primary/70 bg-primary/8 px-3 py-1 rounded-full whitespace-nowrap">
                  {subject} · {cards.length} คน
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map(({ teacher, average, respondents }) => (
                  <button key={teacher.id}
                    onClick={() => { setSelectedTeacher(teacher.id); setViewMode("overview"); }}
                    className="card text-left hover:shadow-card-hover hover:border-primary/20 border border-transparent transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {teacher.avatar_url ? (
                        <img src={teacher.avatar_url} alt={teacher.full_name} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0 border border-primary/10">
                          {teacher.full_name.slice(0, 2)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base-black text-sm truncate group-hover:text-primary transition-colors">{teacher.full_name}</p>
                        {teacher.employee_id && <p className="text-xs text-base-black/40 font-mono">{teacher.employee_id}</p>}
                      </div>
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <span className={`text-3xl font-black ${average >= 4 ? "text-green-600" : average >= 3 ? "text-amber-600" : "text-red-500"}`}>
                          {average.toFixed(2)}
                        </span>
                        <span className="text-xs text-base-black/40 ml-1">/ 5.00</span>
                      </div>
                      <span className="text-xs text-base-black/40">{respondents} ผู้ประเมิน</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${average >= 4 ? "bg-green-500" : average >= 3 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${(average / 5) * 100}%` }} />
                    </div>
                    <p className="text-right text-xs text-base-black/30 mt-1.5">คลิกดูรายละเอียด →</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── OVERVIEW MODE ────────────────────────────────────────────────────── */}
      {viewMode === "overview" && (
        <>
          <div className="card flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-base-black/50 mb-1.5">กรองตามครู</label>
              <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full sm:w-72 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-base-white">
                <option value="__all__">ครูทุกคน (ภาพรวม)</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} {t.employee_id ? `(${t.employee_id})` : ""} {t.subject ? `– ${t.subject}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 text-center">
              <div><div className="text-2xl font-black text-primary">{overallAvg}</div><div className="text-xs text-base-black/40">เฉลี่ยรวม</div></div>
              <div><div className="text-2xl font-black text-base-black">{filteredAverages[0]?.count ?? 0}</div><div className="text-xs text-base-black/40">การตอบ</div></div>
            </div>
          </div>

          {filteredAverages.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-center">
              <p className="text-base-black/40 text-sm">ยังไม่มีข้อมูลคะแนนสำหรับตัวเลือกนี้</p>
            </div>
          ) : (
            <>
              <div className="card">
                <h3 className="font-bold text-primary mb-6">คะแนนเฉลี่ยแต่ละหัวข้อ</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 48, left: 48, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#00000050" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#00000070" }} width={40} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "#2e006b08" }} content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-base-white border border-gray-100 rounded-xl shadow-card p-3 max-w-xs">
                          <p className="text-xs text-base-black/50 mb-1">{d.fullText}</p>
                          <p className="text-primary font-black text-lg">{d.value} <span className="text-xs font-normal text-base-black/40">/ 5.00</span></p>
                          <p className="text-xs text-base-black/40">{d.count} การตอบ</p>
                        </div>
                      );
                    }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={36}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.value >= 4 ? "#2e006b" : entry.value >= 3 ? "#722bff" : "#ffd445"} />
                      ))}
                      <LabelList dataKey="value" position="right" style={{ fontSize: 11, fontWeight: 700, fill: "#2e006b" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {strongest && (
                  <div className="card border-l-4 border-green-400 bg-green-50">
                    <p className="text-xs font-semibold text-green-700 mb-1">💪 จุดแข็งสูงสุด</p>
                    <p className="text-sm text-base-black font-medium">{strongest.questionText}</p>
                    <ScoreChip value={strongest.average} />
                  </div>
                )}
                {weakest && weakest.questionId !== strongest?.questionId && (
                  <div className="card border-l-4 border-amber-400 bg-amber-50">
                    <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ จุดที่ควรพัฒนา</p>
                    <p className="text-sm text-base-black font-medium">{weakest.questionText}</p>
                    <ScoreChip value={weakest.average} />
                  </div>
                )}
              </div>

              <div className="card overflow-x-auto">
                <h3 className="font-bold text-primary mb-4">ตารางคะแนนแต่ละข้อ</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase pr-4">ข้อ</th>
                      <th className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase pr-4">หัวข้อคำถาม</th>
                      <th className="text-center pb-3 text-xs font-semibold text-base-black/40 uppercase pr-4">เฉลี่ย</th>
                      <th className="text-center pb-3 text-xs font-semibold text-base-black/40 uppercase">ผู้ตอบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredAverages.map((q, i) => (
                      <tr key={q.questionId} className="hover:bg-gray-50/80">
                        <td className="py-3 pr-4">
                          <span className="w-7 h-7 rounded-xl bg-primary/8 text-primary text-xs font-bold inline-flex items-center justify-center">{i + 1}</span>
                        </td>
                        <td className="py-3 pr-4 max-w-xs"><p className="text-sm text-base-black leading-relaxed">{q.questionText}</p></td>
                        <td className="py-3 pr-4 text-center"><ScoreChip value={q.average} /></td>
                        <td className="py-3 text-center text-base-black/50 text-sm">{q.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
