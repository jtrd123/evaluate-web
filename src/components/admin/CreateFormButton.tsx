"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CURRENT_THAI_YEAR = (new Date().getFullYear() + 543).toString();

export default function CreateFormButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [academicYear, setAcademicYear] = useState(CURRENT_THAI_YEAR);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle(""); setDescription(""); setAcademicYear(CURRENT_THAI_YEAR); setError(null);
  }

  async function handleCreate() {
    if (!title.trim()) { setError("กรุณาใส่ชื่อแบบฟอร์ม"); return; }
    if (!academicYear.trim()) { setError("กรุณาใส่ปีการศึกษา"); return; }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error: err } = await supabase
      .from("evaluation_forms")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        academic_year: academicYear.trim(),
        created_by: user?.id,
      })
      .select("id")
      .single();

    if (err || !data) {
      setError("สร้างแบบฟอร์มไม่สำเร็จ: " + (err?.message ?? ""));
      setSaving(false);
      return;
    }
    setOpen(false);
    reset();
    router.push(`/admin/forms/${data.id}`);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-accent text-primary font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm hover:bg-accent/90 transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        สร้างแบบฟอร์มใหม่
      </button>

      {open && (
        <div className="fixed inset-0 bg-base-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-base-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up">
            <h2 className="text-lg font-bold text-primary mb-1">สร้างแบบฟอร์มใหม่</h2>
            <p className="text-xs text-base-black/40 mb-5">
              สร้างเสร็จแล้วเพิ่ม "รอบการประเมิน" ในหน้าฟอร์มเพื่อกำหนดวันเปิด-ปิด
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-base-black/70 mb-1.5">
                  ชื่อแบบฟอร์ม <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น แบบประเมินคุณภาพการสอน 2567"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-base-black/70 mb-1.5">
                  ปีการศึกษา <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2567"
                  maxLength={4}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-base-black/40 mt-1">
                  ใช้จัดกลุ่มฟอร์มและกรองข้อมูลในรายงาน
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-base-black/70 mb-1.5">
                  คำอธิบาย <span className="text-base-black/30 font-normal">(ไม่บังคับ)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="รายละเอียดเพิ่มเติม"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => { setOpen(false); reset(); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-primary font-bold text-sm hover:bg-accent/90 disabled:opacity-50 transition-all"
                >
                  {saving ? "กำลังสร้าง..." : "สร้างแบบฟอร์ม"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
