"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { EvaluationQuestion } from "@/lib/types/database.types";

interface Props {
  formId: string;
  initialQuestions: EvaluationQuestion[];
}

const typeLabel: Record<string, string> = {
  rating: "คะแนน 1–5",
  text: "ความคิดเห็น",
};

const typeIcon = {
  rating: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  text: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
};

export default function QuestionManager({ formId, initialQuestions }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [questions, setQuestions] = useState<EvaluationQuestion[]>(initialQuestions);
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<"rating" | "text">("rating");
  const [isRequired, setIsRequired] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addQuestion() {
    if (!newText.trim()) { setError("กรุณาใส่ข้อคำถาม"); return; }
    setSaving(true);
    setError(null);

    const nextIndex = questions.length > 0 ? Math.max(...questions.map((q) => q.order_index)) + 1 : 1;

    const { data, error: err } = await supabase
      .from("evaluation_questions")
      .insert({
        form_id: formId,
        question_text: newText.trim(),
        question_type: newType,
        min_value: newType === "rating" ? 1 : null,
        max_value: newType === "rating" ? 5 : null,
        order_index: nextIndex,
        is_required: isRequired,
      })
      .select("*")
      .single();

    if (err || !data) {
      setError("เพิ่มคำถามไม่สำเร็จ");
    } else {
      setQuestions((prev) => [...prev, data]);
      setNewText("");
      setNewType("rating");
      setIsRequired(true);
      setShowAdd(false);
    }
    setSaving(false);
  }

  async function deleteQuestion(id: string) {
    setDeletingId(id);
    await supabase.from("evaluation_questions").delete().eq("id", id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-primary">
          คำถาม
          <span className="ml-2 text-sm font-normal text-base-black/40">({questions.length} ข้อ)</span>
        </h2>
        <button
          onClick={() => setShowAdd((p) => !p)}
          className="inline-flex items-center gap-1.5 bg-primary text-base-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-primary/90 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          เพิ่มคำถาม
        </button>
      </div>

      {/* Add question form */}
      {showAdd && (
        <div className="card mb-4 border-2 border-accent/30 bg-accent/5 animate-slide-up">
          <h3 className="font-semibold text-primary text-sm mb-3">คำถามใหม่</h3>
          <div className="flex flex-col gap-3">
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              rows={2}
              placeholder="พิมพ์คำถามที่นี่..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />

            <div className="flex flex-wrap gap-3">
              {/* Type selector */}
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                {(["rating", "text"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${
                      newType === t
                        ? "bg-primary text-base-white"
                        : "bg-base-white text-base-black/60 hover:bg-gray-50"
                    }`}
                  >
                    {typeIcon[t]}
                    {typeLabel[t]}
                  </button>
                ))}
              </div>

              {/* Required toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-base-black/60">บังคับตอบ</span>
              </label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdd(false); setError(null); }}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={addQuestion}
                disabled={saving}
                className="flex-1 py-2 rounded-xl bg-accent text-primary font-bold text-sm hover:bg-accent/90 disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "เพิ่มคำถาม"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question list */}
      {questions.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center text-base-black/40">
          <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm">ยังไม่มีคำถาม กดปุ่ม "เพิ่มคำถาม" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="card flex items-start gap-4 animate-fade-in">
              <span className="w-7 h-7 rounded-xl bg-primary/8 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-base-black leading-relaxed">{q.question_text}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    q.question_type === "rating"
                      ? "bg-accent/20 text-amber-700"
                      : "bg-primary/8 text-primary"
                  }`}>
                    {typeIcon[q.question_type]}
                    {typeLabel[q.question_type]}
                  </span>
                  {q.is_required && (
                    <span className="text-xs text-red-400 font-medium">บังคับ</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => deleteQuestion(q.id)}
                disabled={deletingId === q.id}
                className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50 shrink-0"
                title="ลบคำถาม"
              >
                {deletingId === q.id ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
