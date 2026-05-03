"use client";

import { useState } from "react";

interface Teacher { id: string; full_name: string; employee_id?: string; subject?: string; }
interface ClassItem { id: string; name: string; academic_year: string; }
interface Form { id: string; title: string; }
interface Period { id: string; title: string; end_at: string; }

interface Props {
  teachers: Teacher[];
  classes: ClassItem[];
  forms: Form[];
  periods: Period[];
}

export default function ClassAssignmentPanel({ teachers, classes, forms, periods }: Props) {
  // ── Auto-assign state ──────────────────────────────────────────────────────
  const [autoOpen, setAutoOpen]     = useState(false);
  const [autoFormId, setAutoFormId] = useState("");
  const [autoPeriodId, setAutoPeriodId] = useState("");
  const [autoLoading, setAutoLoading]   = useState(false);
  const [autoResult, setAutoResult]     = useState<{ assigned: number; skipped: number; teachers: number; message?: string } | null>(null);
  const [autoError, setAutoError]       = useState<string | null>(null);

  // ── Manual (class-based) state ─────────────────────────────────────────────
  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId]     = useState("");
  const [formId, setFormId]       = useState("");
  const [periodId, setPeriodId]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<{ assigned: number } | null>(null);
  const [error, setError]         = useState<string | null>(null);

  async function handleAutoAssign() {
    if (!autoFormId || !autoPeriodId) {
      setAutoError("กรุณาเลือกแบบฟอร์มและรอบการประเมิน");
      return;
    }
    setAutoLoading(true);
    setAutoError(null);
    setAutoResult(null);

    const res = await fetch("/api/admin/auto-assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form_id: autoFormId, period_id: autoPeriodId }),
    });
    const data = await res.json();
    setAutoLoading(false);
    if (!res.ok) { setAutoError(data.error ?? "เกิดข้อผิดพลาด"); return; }
    setAutoResult(data);
  }

  async function handleAssign() {
    if (!teacherId || !classId || !formId || !periodId) {
      setError("กรุณาเลือกข้อมูลให้ครบทุกช่อง");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/admin/class-assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_id: classId, teacher_id: teacherId, form_id: formId, period_id: periodId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "เกิดข้อผิดพลาด"); return; }
    setResult({ assigned: data.assigned });
  }

  return (
    <div className="space-y-4">

      {/* ── Auto-assign (collapsible) ───────────────────────────────────────── */}
      <div className="card border-2 border-primary/20 bg-primary/2">
        <button
          onClick={() => { setAutoOpen((p) => !p); setAutoResult(null); setAutoError(null); }}
          className="w-full flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-bold text-primary text-sm">จับคู่อัตโนมัติทั้งระบบ</p>
              <p className="text-xs text-base-black/50">ใช้ข้อมูล "ชั้นที่สอน" ของครูทุกคนจับคู่กับนักเรียนในห้องนั้นทีเดียว</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-primary/50 shrink-0 transition-transform ${autoOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {autoOpen && (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-base-black/60 mb-1 block">แบบฟอร์ม</label>
                <select
                  value={autoFormId}
                  onChange={(e) => setAutoFormId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="">-- เลือกแบบฟอร์ม --</option>
                  {forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-base-black/60 mb-1 block">รอบการประเมิน</label>
                <select
                  value={autoPeriodId}
                  onChange={(e) => setAutoPeriodId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="">-- เลือกรอบ --</option>
                  {periods.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <span>ระบบจะจับคู่เฉพาะครูที่มีข้อมูล <b>ชั้นที่สอน</b> เท่านั้น — ครูที่ยังไม่มีข้อมูลจะต้องจับคู่ด้วยตนเองด้านล่าง</span>
            </div>

            {autoError && (
              <p className="text-xs text-red-600 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {autoError}
              </p>
            )}

            {autoResult && (
              <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm border ${
                autoResult.assigned > 0
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-gray-50 border-gray-200 text-base-black/60"
              }`}>
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  {autoResult.message ? (
                    <p className="font-semibold">{autoResult.message}</p>
                  ) : (
                    <>
                      <p className="font-bold">จับคู่สำเร็จ!</p>
                      <p className="text-xs mt-0.5">
                        สร้างใหม่ {autoResult.assigned} คู่ · ซ้ำ (ข้าม) {autoResult.skipped} คู่ · ครูที่ประมวลผล {autoResult.teachers} คน
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleAutoAssign}
              disabled={autoLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {autoLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />กำลังจับคู่...</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                  จับคู่อัตโนมัติทั้งระบบ
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Manual class-based assignment ──────────────────────────────────── */}
      <div className="card">
        <div className="mb-5">
          <h2 className="text-base font-bold text-primary">มอบหมายแบบกลุ่ม (ตามห้องเรียน)</h2>
          <p className="text-sm text-base-black/50 mt-1">
            เลือกครู + ห้องเรียน + แบบฟอร์ม + รอบ — สำหรับจับคู่เพิ่มเติมหรือครูที่ไม่มีข้อมูลชั้นที่สอน
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-xs font-semibold text-base-black/60 mb-1 block">ครู</label>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
              <option value="">-- เลือกครู --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name}{t.subject ? ` (${t.subject})` : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-base-black/60 mb-1 block">ห้องเรียน</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
              <option value="">-- เลือกห้อง --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.academic_year})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-base-black/60 mb-1 block">แบบฟอร์ม</label>
            <select value={formId} onChange={(e) => setFormId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
              <option value="">-- เลือกแบบฟอร์ม --</option>
              {forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-base-black/60 mb-1 block">รอบการประเมิน</label>
            <select value={periodId} onChange={(e) => setPeriodId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
              <option value="">-- เลือกรอบ --</option>
              {periods.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 mb-3 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {result && (
          <div className="mb-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-700 font-semibold">
              {result.assigned > 0 ? `มอบหมายสำเร็จ ${result.assigned} คน` : "มอบหมายแล้ว (ไม่มีนักเรียนใหม่ที่ต้องเพิ่ม)"}
            </p>
          </div>
        )}

        <button onClick={handleAssign} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          )}
          {loading ? "กำลังมอบหมาย..." : "มอบหมายทั้งห้อง"}
        </button>
      </div>
    </div>
  );
}
