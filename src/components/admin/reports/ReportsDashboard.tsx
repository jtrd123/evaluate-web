"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import CompletionReport from "./CompletionReport";
import QuestionAnalysisReport from "./QuestionAnalysisReport";
import CommentsReport from "./CommentsReport";
import PerformanceTiering from "./PerformanceTiering";

// ── Raw types from Supabase ────────────────────────────────────────────────
export interface RawAssignment { id: string; student_id: string; teacher_id: string; class_id: string | null; }
export interface RawSubmission { id: string; assignment_id: string; student_id: string; teacher_id: string; is_submitted: boolean; submitted_at: string; }
export interface RawResponse { id: string; submission_id: string; question_id: string; rating_value: number | null; text_value: string | null; }
export interface RawQuestion { id: string; question_text: string; question_type: string; order_index: number; }
export interface RawProfile { id: string; full_name: string; subject: string | null; employee_id: string | null; student_number: string | null; role: string; }
export interface RawClass { id: string; name: string; academic_year: string; }

// ── Computed types ─────────────────────────────────────────────────────────
export interface ClassCompletion {
  classId: string | null;
  className: string;
  total: number;
  completed: number;
  pct: number;
}

export interface QuestionAvg {
  questionId: string;
  questionText: string;
  orderIndex: number;
  average: number;
  count: number;
}

export interface TeacherScore {
  teacherId: string;
  teacherName: string;
  employeeId: string | null;
  subject: string | null;
  average: number;
  respondents: number;
}

export interface CommentRow {
  text: string;
  teacherName: string;
  teacherSubject: string | null;
  className: string | null;
  studentName: string | null;
  studentNumber: string | null;
  submittedAt: string;
}

interface Props {
  assignments: RawAssignment[];
  submissions: RawSubmission[];
  responses: RawResponse[];
  questions: RawQuestion[];
  profiles: RawProfile[];
  classes: RawClass[];
}

const TABS = [
  { id: "completion", label: "ความคืบหน้า", icon: "⏱" },
  { id: "questions", label: "วิเคราะห์คะแนน", icon: "📊" },
  { id: "comments", label: "ข้อเสนอแนะ", icon: "💬" },
  { id: "ranking", label: "อันดับครู", icon: "🏆" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ReportsDashboard({ assignments, submissions, responses, questions, profiles, classes }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("completion");
  const [yearFilter, setYearFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  // ── Pre-compute maps first (needed for filters below) ───────────────────
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const questionMap = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);

  // ── All available years (from classes) ───────────────────────────────────
  const allYears = useMemo(() => {
    const s = new Set(classes.map((c) => c.academic_year).filter(Boolean));
    return Array.from(s).sort((a, b) => b.localeCompare(a));
  }, [classes]);

  // ── All available subjects (from teacher profiles) ────────────────────────
  const allSubjects = useMemo(() => {
    const s = new Set(
      profiles.filter((p) => p.role === "teacher" && p.subject).map((p) => p.subject!)
    );
    return Array.from(s).sort((a, b) => a.localeCompare(b, "th"));
  }, [profiles]);

  // ── Filter by year + subject ──────────────────────────────────────────────
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (yearFilter) {
        const cls = a.class_id ? classMap.get(a.class_id) : null;
        if (cls?.academic_year !== yearFilter) return false;
      }
      if (subjectFilter) {
        const teacher = profileMap.get(a.teacher_id);
        if (teacher?.subject !== subjectFilter) return false;
      }
      return true;
    });
  }, [assignments, classMap, profileMap, yearFilter, subjectFilter]);

  const filteredAssignmentIds = useMemo(
    () => new Set(filteredAssignments.map((a) => a.id)),
    [filteredAssignments]
  );

  const filteredSubmissions = useMemo(
    () => submissions.filter((s) => filteredAssignmentIds.has(s.assignment_id)),
    [submissions, filteredAssignmentIds]
  );

  const filteredSubmissionIds = useMemo(
    () => new Set(filteredSubmissions.map((s) => s.id)),
    [filteredSubmissions]
  );

  const filteredResponses = useMemo(
    () => responses.filter((r) => filteredSubmissionIds.has(r.submission_id)),
    [responses, filteredSubmissionIds]
  );

  const submissionMap = useMemo(() => new Map(filteredSubmissions.map((s) => [s.id, s])), [filteredSubmissions]);

  // ── 1. Completion by class ───────────────────────────────────────────────
  const completionByClass = useMemo<ClassCompletion[]>(() => {
    const buckets = new Map<string, ClassCompletion>();

    for (const a of filteredAssignments) {
      const key = a.class_id ?? "__none__";
      const cls = a.class_id ? classMap.get(a.class_id) : null;
      if (!buckets.has(key)) {
        buckets.set(key, {
          classId: a.class_id,
          className: cls ? `${cls.name} (${cls.academic_year})` : "ไม่ระบุชั้น",
          total: 0,
          completed: 0,
          pct: 0,
        });
      }
      const b = buckets.get(key)!;
      b.total++;
      const sub = filteredSubmissions.find((s) => s.assignment_id === a.id);
      if (sub?.is_submitted) b.completed++;
    }

    return Array.from(buckets.values())
      .map((b) => ({ ...b, pct: b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0 }))
      .sort((a, b) => a.pct - b.pct);
  }, [filteredAssignments, filteredSubmissions, classMap]);

  const overallCompletion = useMemo(() => {
    const total = filteredAssignments.length;
    const done = filteredSubmissions.length;
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [filteredAssignments, filteredSubmissions]);

  // ── 2. Question averages (all teachers combined) ─────────────────────────
  const questionAverages = useMemo<QuestionAvg[]>(() => {
    const acc = new Map<string, { sum: number; count: number }>();

    for (const r of filteredResponses) {
      if (r.rating_value === null) continue;
      const q = questionMap.get(r.question_id);
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
        return {
          questionId: q.id,
          questionText: q.question_text,
          orderIndex: q.order_index,
          average: a ? parseFloat((a.sum / a.count).toFixed(2)) : 0,
          count: a?.count ?? 0,
        };
      })
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [filteredResponses, questions, questionMap]);

  // ── 3. Comments (text responses) ─────────────────────────────────────────
  const comments = useMemo<CommentRow[]>(() => {
    return filteredResponses
      .filter((r) => r.text_value && r.text_value.trim())
      .map((r) => {
        const sub = submissionMap.get(r.submission_id);
        if (!sub) return null;
        const teacher = profileMap.get(sub.teacher_id);
        const student = profileMap.get(sub.student_id);
        const assign = filteredAssignments.find((a) => a.id === sub.assignment_id);
        const cls = assign?.class_id ? classMap.get(assign.class_id) : null;
        return {
          text: r.text_value!,
          teacherName: teacher?.full_name ?? "—",
          teacherSubject: teacher?.subject ?? null,
          className: cls ? `${cls.name} (${cls.academic_year})` : null,
          studentName: student?.full_name ?? null,
          studentNumber: student?.student_number ?? null,
          submittedAt: sub.submitted_at,
        } as CommentRow;
      })
      .filter(Boolean) as CommentRow[];
  }, [filteredResponses, submissionMap, profileMap, filteredAssignments, classMap]);

  // ── 4. Teacher performance scores ────────────────────────────────────────
  const teacherScores = useMemo<TeacherScore[]>(() => {
    const acc = new Map<string, { sum: number; count: number; respondents: Set<string> }>();

    for (const r of filteredResponses) {
      if (r.rating_value === null) continue;
      const sub = submissionMap.get(r.submission_id);
      if (!sub) continue;
      const cur = acc.get(sub.teacher_id) ?? { sum: 0, count: 0, respondents: new Set() };
      cur.sum += r.rating_value;
      cur.count++;
      cur.respondents.add(sub.student_id);
      acc.set(sub.teacher_id, cur);
    }

    return profiles
      .filter((p) => p.role === "teacher")
      .map((p) => {
        const a = acc.get(p.id);
        return {
          teacherId: p.id,
          teacherName: p.full_name,
          employeeId: p.employee_id,
          subject: p.subject,
          average: a ? parseFloat((a.sum / a.count).toFixed(2)) : 0,
          respondents: a?.respondents.size ?? 0,
        };
      })
      .filter((t) => t.respondents > 0)
      .sort((a, b) => b.average - a.average);
  }, [filteredResponses, profiles, submissionMap]);

  // ── Class comparison (avg score per class) ───────────────────────────────
  const classScores = useMemo(() => {
    const acc = new Map<string, { sum: number; count: number }>();

    for (const r of filteredResponses) {
      if (r.rating_value === null) continue;
      const sub = submissionMap.get(r.submission_id);
      if (!sub) continue;
      const assign = filteredAssignments.find((a) => a.id === sub.assignment_id);
      const classId = assign?.class_id ?? "__none__";
      const cur = acc.get(classId) ?? { sum: 0, count: 0 };
      cur.sum += r.rating_value;
      cur.count++;
      acc.set(classId, cur);
    }

    return Array.from(acc.entries())
      .map(([classId, { sum, count }]) => {
        const cls = classId !== "__none__" ? classMap.get(classId) : null;
        return {
          classId,
          className: cls ? `${cls.name}` : "ไม่ระบุ",
          average: parseFloat((sum / count).toFixed(2)),
          count,
        };
      })
      .sort((a, b) => b.average - a.average);
  }, [filteredResponses, submissionMap, filteredAssignments, classMap]);

  const teachers = useMemo(() => profiles.filter((p) => p.role === "teacher"), [profiles]);

  function handleExport() {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Teacher scores
    const scoreRows = teacherScores.map((t) => ({
      "ชื่อ-นามสกุล": t.teacherName,
      "รหัสครู": t.employeeId ?? "",
      "กลุ่มสาระ": t.subject ?? "",
      "คะแนนเฉลี่ย": t.average,
      "จำนวนผู้ประเมิน": t.respondents,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(scoreRows), "อันดับครู");

    // Sheet 2: Completion by class
    const compRows = completionByClass.map((c) => ({
      "ห้องเรียน": c.className,
      "ทั้งหมด": c.total,
      "ส่งแล้ว": c.completed,
      "% สำเร็จ": c.pct,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(compRows), "ความคืบหน้า");

    // Sheet 3: Question averages
    const qRows = questionAverages.map((q) => ({
      "คำถาม": q.questionText,
      "คะแนนเฉลี่ย": q.average,
      "จำนวนคำตอบ": q.count,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(qRows), "วิเคราะห์คะแนน");

    const label = yearFilter ? `_${yearFilter}` : "";
    XLSX.writeFile(wb, `รายงานประเมินครู${label}.xlsx`);
  }

  return (
    <div>
      {/* Year filter + export */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
      {allYears.length > 0 && (
        <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm w-fit">
          <svg className="w-4 h-4 text-primary/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
          </svg>
          <label className="text-xs font-semibold text-base-black/50 shrink-0">ปีการศึกษา</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="text-sm font-semibold text-primary bg-transparent focus:outline-none cursor-pointer pr-1"
          >
            <option value="">ทั้งหมด</option>
            {allYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      {allSubjects.length > 0 && (
        <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm w-fit">
          <svg className="w-4 h-4 text-primary/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <label className="text-xs font-semibold text-base-black/50 shrink-0">กลุ่มสาระ</label>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="text-sm font-semibold text-primary bg-transparent focus:outline-none cursor-pointer pr-1 max-w-[160px]"
          >
            <option value="">ทั้งหมด</option>
            {allSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handleExport}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Export Excel
      </button>
      </div>

      {/* Tab bar */}
      <div className="bg-base-white rounded-2xl shadow-card border border-gray-100 mb-6 overflow-hidden">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? "border-primary text-primary bg-primary/3"
                  : "border-transparent text-base-black/50 hover:text-primary hover:bg-gray-50"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "completion" && (
        <CompletionReport
          overall={overallCompletion}
          byClass={completionByClass}
        />
      )}
      {activeTab === "questions" && (
        <QuestionAnalysisReport
          questionAverages={questionAverages}
          teachers={teachers}
          responses={responses}
          questions={questions}
          submissions={submissions}
        />
      )}
      {activeTab === "comments" && (
        <CommentsReport
          comments={comments}
          teachers={teachers}
          classes={classes}
        />
      )}
      {activeTab === "ranking" && (
        <PerformanceTiering
          teacherScores={teacherScores}
          classScores={classScores}
        />
      )}
    </div>
  );
}
