"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  formId: string;
  initialAcademicYear: string | null;
}

export default function FormSettings({ formId, initialAcademicYear }: Props) {
  const [academicYear, setAcademicYear] = useState(initialAcademicYear ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("evaluation_forms")
      .update({ academic_year: academicYear.trim() || null })
      .eq("id", formId);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-base font-bold text-primary">ตั้งค่าแบบฟอร์ม</h2>
        <p className="text-xs text-base-black/50 mt-0.5">
          ปีการศึกษาใช้สำหรับจัดกลุ่มฟอร์มในรายงาน — กำหนดช่วงเวลาได้ที่หัวข้อ "รอบการประเมิน" ด้านล่าง
        </p>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1 max-w-xs">
          <label className="block text-xs font-semibold text-base-black/60 mb-1">ปีการศึกษา</label>
          <input
            type="text"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="เช่น 2567"
            maxLength={4}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? "..." : "บันทึก"}
        </button>
        {saved && (
          <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            บันทึกแล้ว
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
