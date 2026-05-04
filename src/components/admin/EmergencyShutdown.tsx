"use client";

import { useState } from "react";

interface Props {
  initialEnabled: boolean;
  initialMessage: string;
}

export default function EmergencyShutdown({ initialEnabled, initialMessage }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState(initialMessage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function updateSetting(key: string, value: string) {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    return res.ok;
  }

  async function handleToggle() {
    if (enabled) {
      setConfirmOpen(true);
    } else {
      setSaving(true);
      await updateSetting("evaluations_enabled", "true");
      setEnabled(true);
      setSaving(false);
      flashSaved();
    }
  }

  async function confirmShutdown() {
    setConfirmOpen(false);
    setSaving(true);
    await updateSetting("evaluations_enabled", "false");
    setEnabled(false);
    setSaving(false);
    flashSaved();
  }

  async function saveMessage() {
    setSaving(true);
    await updateSetting("shutdown_message", message);
    setSaving(false);
    flashSaved();
  }

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <div className="card space-y-5">
        <div>
          <h2 className="font-bold text-base-black mb-1">การควบคุมระบบ</h2>
          <p className="text-xs text-base-black/50">เปิด/ปิดการประเมินทั้งหมดในระบบ</p>
        </div>

        {/* Status display */}
        <div className={`rounded-2xl px-4 py-4 border-2 ${enabled ? "bg-green-50 border-green-200" : "bg-red-50 border-red-300"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${enabled ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
              <div>
                <p className={`font-bold text-sm ${enabled ? "text-green-700" : "text-red-700"}`}>
                  {enabled ? "ระบบทำงานปกติ" : "ปิดระบบอยู่"}
                </p>
                <p className={`text-xs ${enabled ? "text-green-600/70" : "text-red-600/70"}`}>
                  {enabled ? "นักเรียนสามารถส่งการประเมินได้" : "นักเรียนไม่สามารถส่งได้"}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                enabled
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {saving ? "..." : enabled ? "ปิดระบบ" : "เปิดระบบ"}
            </button>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="text-xs font-semibold text-base-black/60 mb-2 block">
            ข้อความเมื่อปิดระบบ
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ระบบปิดชั่วคราว กรุณาติดต่อผู้ดูแลระบบ"
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            />
            <button
              onClick={saveMessage}
              disabled={saving}
              className="px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
            >
              บันทึก
            </button>
          </div>
        </div>

        {saved && (
          <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            บันทึกแล้ว
          </p>
        )}
      </div>

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-base-black">ยืนยันการปิดระบบ?</h3>
                <p className="text-sm text-base-black/60 mt-0.5">นักเรียนทุกคนจะไม่สามารถส่งการประเมินได้ทันที</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/70 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={confirmShutdown} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700">
                ปิดระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
