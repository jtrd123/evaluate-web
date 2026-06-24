"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import type { EvaluationQuestion, AssignmentWithTeacher } from "@/lib/types/database.types";

const FACE_OPTIONS = [
  { value: 1, label: "ปรับปรุง",  emoji: "😞", color: "bg-red-100 border-red-300 text-red-600",    active: "bg-red-500 border-red-500 text-white" },
  { value: 2, label: "พอใช้",     emoji: "😕", color: "bg-orange-100 border-orange-300 text-orange-600", active: "bg-orange-500 border-orange-500 text-white" },
  { value: 3, label: "ดี",        emoji: "🙂", color: "bg-yellow-100 border-yellow-300 text-yellow-700", active: "bg-yellow-400 border-yellow-400 text-white" },
  { value: 4, label: "ดีมาก",    emoji: "😊", color: "bg-lime-100 border-lime-300 text-lime-700",   active: "bg-lime-500 border-lime-500 text-white" },
  { value: 5, label: "ดีเยี่ยม", emoji: "😄", color: "bg-green-100 border-green-300 text-green-700", active: "bg-green-500 border-green-500 text-white" },
];

function FaceRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {FACE_OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary disabled:cursor-not-allowed min-w-[60px]
              ${isSelected ? opt.active + " scale-105 shadow-md" : opt.color + " hover:scale-105 hover:shadow-sm"}`}
          >
            <span className="text-2xl leading-none">{opt.emoji}</span>
            <span className="text-[11px] font-semibold leading-none whitespace-nowrap">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function EvaluatePage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<AssignmentWithTeacher | null>(null);
  const [questions, setQuestions] = useState<EvaluationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Check system shutdown
      const { data: settings } = await supabase.from("system_settings").select("key,value");
      const settingsMap = Object.fromEntries((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]));
      if (settingsMap["evaluations_enabled"] === "false") {
        router.push("/student");
        return;
      }

      // Load assignment
      const { data: a, error: ae } = await supabase
        .from("teacher_assignments")
        .select(`
          id, student_id, teacher_id, form_id, period_id, class_id, created_at,
          teacher:profiles!teacher_assignments_teacher_id_fkey (id, full_name, subject, employee_id, avatar_url),
          form:evaluation_forms!teacher_assignments_form_id_fkey (id, title, academic_year),
          period:evaluation_periods!teacher_assignments_period_id_fkey (id, title, start_at, end_at),
          submission:evaluation_submissions (id, is_submitted, submitted_at)
        `)
        .eq("id", assignmentId)
        .eq("student_id", user.id)
        .single();

      if (ae || !a) { router.push("/student"); return; }

      // PostgREST returns array for one-to-many; check [0]
      const rawSub = Array.isArray(a.submission) ? a.submission[0] ?? null : a.submission;
      if (rawSub?.is_submitted) { router.push("/student"); return; }

      // Check evaluation window from period
      const typedA = a as unknown as AssignmentWithTeacher;
      const now2 = new Date();
      if (now2 > new Date(typedA.period.end_at)) { router.push("/student"); return; }
      if (now2 < new Date(typedA.period.start_at)) { router.push("/student"); return; }
      setAssignment(typedA);

      // Load questions
      const { data: qs } = await supabase
        .from("evaluation_questions")
        .select("*")
        .eq("form_id", typedA.form_id)
        .order("order_index");

      setQuestions(qs ?? []);
      setLoading(false);
    }
    load();
  }, [assignmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignment) return;

    // Validate all required questions answered
    const unanswered = questions.filter((q) => {
      if (!q.is_required) return false;
      const ans = answers[q.id];
      return ans === undefined || ans === "" || ans === 0;
    });

    if (unanswered.length > 0) {
      setError(`กรุณาตอบคำถามให้ครบ (ยังขาด ${unanswered.length} ข้อ)`);
      return;
    }

    setSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create submission record
    const { data: submission, error: subErr } = await supabase
      .from("evaluation_submissions")
      .insert({
        assignment_id: assignment.id,
        student_id: user.id,
        teacher_id: assignment.teacher_id,
        form_id: assignment.form_id,
        period_id: assignment.period_id,
        is_submitted: true,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (subErr || !submission) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setSubmitting(false);
      return;
    }

    // Insert individual responses
    const responseRows = questions.map((q) => ({
      submission_id: submission.id,
      question_id: q.id,
      rating_value: q.question_type === "rating" ? Number(answers[q.id] ?? 0) : null,
      text_value: q.question_type === "text"
        ? (String(answers[q.id] ?? "").trim() || null)
        : null,
    }));

    const { error: respErr } = await supabase
      .from("evaluation_responses")
      .insert(responseRows);

    if (respErr) {
      setError("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่");
      setSubmitting(false);
      return;
    }

    router.push("/student?submitted=1");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-base-black/50 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  const completionPct = Math.round(
    (Object.keys(answers).filter((k) => answers[k] !== "" && answers[k] !== 0).length /
      Math.max(questions.length, 1)) *
      100
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-primary sticky top-0 z-50 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/student")}
            className="text-base-white/70 hover:text-base-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-base-white font-bold text-sm truncate">{assignment.form.title}</p>
            <p className="text-accent text-xs">{assignment.teacher.full_name}</p>
          </div>
          {/* Progress pill */}
          <div className="shrink-0 bg-base-white/10 px-3 py-1 rounded-full text-base-white text-xs font-semibold">
            {completionPct}%
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-base-white/10">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Teacher info card */}
        <div className="card mb-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/10">
              {assignment.teacher.full_name.slice(0, 2)}
            </div>
            <div>
              <h1 className="font-bold text-primary text-lg">{assignment.teacher.full_name}</h1>
              <p className="text-base-black/60 text-sm">{assignment.teacher.subject}</p>
              <p className="text-base-black/40 text-xs font-mono mt-0.5">
                รหัส {assignment.teacher.employee_id}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {questions.map((q, idx) => (
            <div key={q.id} className="card animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
              <div className="flex items-start gap-3 mb-4">
                <span className="w-7 h-7 rounded-xl bg-primary/8 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="font-semibold text-base-black text-sm leading-relaxed">
                  {q.question_text}
                  {q.is_required && <span className="text-red-400 ml-1">*</span>}
                </p>
              </div>

              {q.question_type === "rating" ? (
                <FaceRating
                  value={Number(answers[q.id] ?? 0)}
                  onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                  disabled={submitting}
                />
              ) : (
                <textarea
                  value={String(answers[q.id] ?? "")}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  disabled={submitting}
                  rows={3}
                  placeholder="พิมพ์ข้อความที่นี่... (ถ้ามี)"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-base-black placeholder:text-base-black/30 resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all disabled:bg-gray-50"
                />
              )}
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full mt-2 shadow-md"
          >
            {submitting ? "กำลังบันทึก..." : "ยืนยันการประเมิน"}
          </Button>

          <p className="text-center text-xs text-base-black/40 pb-4">
            หลังจากส่งแล้วจะไม่สามารถแก้ไขได้อีก • ข้อมูลเป็นความลับ
          </p>
        </form>
      </main>
    </div>
  );
}
