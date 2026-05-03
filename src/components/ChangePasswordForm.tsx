"use client";

import { useState } from "react";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { setError("รหัสผ่านใหม่ไม่ตรงกัน"); return; }
    if (next.length < 6) { setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return; }

    setSaving(true); setError(null); setSuccess(false);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: next }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setSuccess(true);
    setCurrent(""); setNext(""); setConfirm("");
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white";

  return (
    <div className="card">
      <h2 className="text-sm font-bold text-base-black/50 uppercase tracking-wide mb-4">เปลี่ยนรหัสผ่าน</h2>

      {success && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-green-700 text-sm font-semibold">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          เปลี่ยนรหัสผ่านสำเร็จแล้ว
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-base-black/60 mb-1 block">รหัสผ่านใหม่</label>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-base-black/60 mb-1 block">ยืนยันรหัสผ่านใหม่</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
            className={inputCls}
            required
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
        </button>
      </form>
    </div>
  );
}
