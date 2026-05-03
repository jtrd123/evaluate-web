"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

interface Period {
  id: string;
  title: string;
  academic_year: string | null;
  start_at: string;
  end_at: string;
}

interface Props {
  formId: string;              // required — periods belong to a form
  formAcademicYear: string | null;
  initialPeriods: Period[];
}

export default function PeriodManager({ formId, formAcademicYear, initialPeriods }: Props) {
  const [periods, setPeriods] = useState<Period[]>(initialPeriods);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    academic_year: formAcademicYear ?? "",
    start_at: "",
    end_at: "",
  });
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleAdd() {
    if (!form.title.trim() || !form.start_at || !form.end_at) {
      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    if (new Date(form.end_at) <= new Date(form.start_at)) {
      setError("วันสิ้นสุดต้องมาหลังวันเริ่มต้น");
      return;
    }
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      form_id: formId,
      title: form.title.trim(),
      start_at: form.start_at,
      end_at: form.end_at,
    };
    const academicYear = form.academic_year.trim() || null;

    // Try with academic_year first; fall back if the column doesn't exist yet
    let { data, error: err } = await supabase
      .from("evaluation_periods")
      .insert({ ...payload, academic_year: academicYear })
      .select("id, title, academic_year, start_at, end_at")
      .single();

    if (err?.message?.includes("academic_year")) {
      const r2 = await supabase
        .from("evaluation_periods")
        .insert(payload)
        .select("id, title, start_at, end_at")
        .single();
      data = r2.data ? { ...r2.data, academic_year: null } : null;
      err = r2.error;
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    if (!data) { setError("ไม่มีข้อมูลที่บันทึก"); return; }
    setPeriods((prev) => [data as Period, ...prev]);
    setForm({ title: "", academic_year: formAcademicYear ?? "", start_at: "", end_at: "" });
    setAdding(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const { error: err } = await supabase.from("evaluation_periods").delete().eq("id", id);
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (err) { setError(err.message); return; }
    setPeriods((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-primary">รอบการประเมิน</h2>
          <p className="text-xs text-base-black/50 mt-0.5">
            แต่ละรอบมีช่วงวันเปิด-ปิด นักเรียนทำแบบประเมินได้เฉพาะในช่วงนั้น
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            เพิ่มรอบ
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="mb-5 p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-base-black/60 mb-1 block">ชื่อรอบ</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="เช่น ครั้งที่ 1/2567"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-base-black/60 mb-1 block">ปีการศึกษา</label>
              <input
                type="text"
                value={form.academic_year}
                onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
                placeholder="2567"
                maxLength={4}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-base-black/60 mb-1 block">เปิดรับประเมิน</label>
              <input
                type="datetime-local"
                value={form.start_at}
                onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-base-black/60 mb-1 block">ปิดรับประเมิน</label>
              <input
                type="datetime-local"
                value={form.end_at}
                onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <button
              onClick={() => { setAdding(false); setError(null); }}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-base-black/60 hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {periods.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-base-black/40">ยังไม่มีรอบการประเมิน</p>
          <p className="text-xs text-base-black/30 mt-1">
            สร้างรอบเพื่อกำหนดช่วงเวลาที่นักเรียนเข้าทำแบบประเมินได้
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {periods.map((p) => {
            const now = new Date();
            const started = new Date(p.start_at) <= now;
            const ended = new Date(p.end_at) < now;
            const active = started && !ended;
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-base-black truncate">{p.title}</p>
                    {p.academic_year && (
                      <span className="text-xs text-primary/70 bg-primary/8 px-1.5 py-0.5 rounded-md">
                        ปี {p.academic_year}
                      </span>
                    )}
                    {active && (
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        กำลังเปิดรับ
                      </span>
                    )}
                    {ended && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">ปิดรับแล้ว</span>
                    )}
                    {!started && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">ยังไม่ถึงเวลา</span>
                    )}
                  </div>
                  <p className="text-xs text-base-black/40 mt-0.5">
                    {formatDate(p.start_at)} — {formatDate(p.end_at)}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmDeleteId(p.id)}
                  disabled={deletingId === p.id}
                  className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                >
                  {deletingId === p.id ? (
                    <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold text-base-black mb-2">ลบรอบการประเมิน?</h3>
            <p className="text-sm text-base-black/60 mb-5">
              การมอบหมายและผลการประเมินทั้งหมดในรอบนี้จะถูกลบถาวร
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/70 hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
