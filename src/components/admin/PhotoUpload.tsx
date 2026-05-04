"use client";

import { useState, useRef } from "react";

interface Teacher {
  id: string;
  full_name: string;
  employee_id: string | null;
  avatar_url: string | null;
  subject: string | null;
}

interface FileEntry {
  file: File;
  preview: string;
  matched: Teacher | null;
  status: "pending" | "uploading" | "success" | "error";
  errorMsg?: string;
  resultUrl?: string;
}

function matchTeacher(filename: string, teachers: Teacher[]): Teacher | null {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "").trim();
  const byId = teachers.find(t => t.employee_id?.toLowerCase() === nameWithoutExt.toLowerCase());
  if (byId) return byId;
  const byName = teachers.find(t => t.full_name.includes(nameWithoutExt) || nameWithoutExt.includes(t.full_name));
  return byName ?? null;
}

export default function PhotoUpload({ teachers }: { teachers: Teacher[] }) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFiles(files: FileList | File[]) {
    const newEntries: FileEntry[] = Array.from(files)
      .filter(f => f.type.startsWith("image/"))
      .map(file => ({
        file,
        preview: URL.createObjectURL(file),
        matched: matchTeacher(file.name, teachers),
        status: "pending" as const,
      }));
    setEntries(prev => [...prev, ...newEntries]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    processFiles(e.dataTransfer.files);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) processFiles(e.target.files);
  }

  function removeEntry(idx: number) {
    setEntries(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  }

  async function uploadAll() {
    setUploading(true);
    const toUpload = entries.filter(e => e.matched && e.status === "pending");

    for (let i = 0; i < toUpload.length; i++) {
      const entry = toUpload[i];
      const idx = entries.indexOf(entry);

      setEntries(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], status: "uploading" };
        return next;
      });

      try {
        const formData = new FormData();
        formData.append("file", entry.file);
        formData.append("teacher_id", entry.matched!.id);

        const res = await fetch("/api/admin/upload-photo", { method: "POST", body: formData });
        const data = await res.json() as { ok?: boolean; url?: string; error?: string };

        setEntries(prev => {
          const next = [...prev];
          if (data.ok) {
            next[idx] = { ...next[idx], status: "success", resultUrl: data.url };
          } else {
            next[idx] = { ...next[idx], status: "error", errorMsg: data.error ?? "เกิดข้อผิดพลาด" };
          }
          return next;
        });
      } catch {
        setEntries(prev => {
          const next = [...prev];
          next[idx] = { ...next[idx], status: "error", errorMsg: "เกิดข้อผิดพลาด" };
          return next;
        });
      }
    }

    setUploading(false);
  }

  const matchedCount = entries.filter(e => e.matched).length;
  const successCount = entries.filter(e => e.status === "success").length;
  const pendingMatched = entries.filter(e => e.matched && e.status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Drop zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/2 transition-all"
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleInput} />
        <div className="w-14 h-14 bg-primary/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <p className="font-semibold text-base-black mb-1">ลากรูปมาวาง หรือคลิกเพื่อเลือกไฟล์</p>
        <p className="text-sm text-base-black/40">รองรับหลายไฟล์ — ตั้งชื่อไฟล์เป็นรหัสครู เช่น T0001.jpg</p>
      </div>

      {entries.length > 0 && (
        <>
          {/* Summary */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-gray-50 rounded-xl px-4 py-2 text-sm">
              <span className="font-bold text-base-black">{entries.length}</span>
              <span className="text-base-black/50 ml-1">ไฟล์</span>
            </div>
            <div className="bg-green-50 rounded-xl px-4 py-2 text-sm">
              <span className="font-bold text-green-600">{matchedCount}</span>
              <span className="text-green-700/70 ml-1">จับคู่ได้</span>
            </div>
            <div className="bg-red-50 rounded-xl px-4 py-2 text-sm">
              <span className="font-bold text-red-500">{entries.length - matchedCount}</span>
              <span className="text-red-700/70 ml-1">ไม่พบครู</span>
            </div>
            {successCount > 0 && (
              <div className="bg-blue-50 rounded-xl px-4 py-2 text-sm">
                <span className="font-bold text-blue-600">{successCount}</span>
                <span className="text-blue-700/70 ml-1">อัปโหลดแล้ว</span>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-3 text-xs font-semibold text-base-black/40 pr-4">ไฟล์</th>
                  <th className="text-left pb-3 text-xs font-semibold text-base-black/40 pr-4">รูป</th>
                  <th className="text-left pb-3 text-xs font-semibold text-base-black/40 pr-4">ครู</th>
                  <th className="text-left pb-3 text-xs font-semibold text-base-black/40 pr-4">สถานะ</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80">
                    <td className="py-3 pr-4">
                      <p className="text-xs text-base-black/70 font-mono max-w-[120px] truncate">{entry.file.name}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <img src={entry.preview} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    </td>
                    <td className="py-3 pr-4">
                      {entry.matched ? (
                        <div>
                          <p className="text-sm font-semibold text-base-black">{entry.matched.full_name}</p>
                          {entry.matched.employee_id && (
                            <p className="text-xs text-base-black/40 font-mono">{entry.matched.employee_id}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 font-semibold">ไม่พบ</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {entry.status === "pending" && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${entry.matched ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                          {entry.matched ? "รอ" : "ข้าม"}
                        </span>
                      )}
                      {entry.status === "uploading" && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">กำลังอัปโหลด...</span>
                      )}
                      {entry.status === "success" && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">สำเร็จ</span>
                      )}
                      {entry.status === "error" && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold" title={entry.errorMsg}>ผิดพลาด</span>
                      )}
                    </td>
                    <td className="py-3">
                      <button onClick={() => removeEntry(idx)} className="text-base-black/20 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Upload button */}
          {pendingMatched > 0 && (
            <button
              onClick={uploadAll}
              disabled={uploading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังอัปโหลด...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  ยืนยันอัปโหลด {pendingMatched} รูป
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
