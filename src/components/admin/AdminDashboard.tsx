"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";

interface SubmissionRow {
  id: string;
  is_submitted: boolean;
  submitted_at: string | null;
  student: { full_name: string; student_number: string } | null;
  teacher: { full_name: string; employee_id: string } | null;
  period: { title: string; end_at: string } | null;
}

interface Props {
  submissions: SubmissionRow[];
}

export default function AdminDashboard({ submissions }: Props) {
  const [showAnonymous, setShowAnonymous] = useState(true);
  const [search, setSearch] = useState("");

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.teacher?.full_name.toLowerCase().includes(q) ||
      s.student?.full_name.toLowerCase().includes(q) ||
      s.student?.student_number.toLowerCase().includes(q)
    );
  });

  return (
    <div className="card animate-slide-up">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <h2 className="font-bold text-primary text-base">ตารางการประเมิน</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ / รหัส..."
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={() => setShowAnonymous((p) => !p)}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
              showAnonymous
                ? "bg-primary/8 border-primary/20 text-primary"
                : "bg-base-white border-gray-200 text-base-black/60 hover:border-primary/30"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {showAnonymous ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              )}
            </svg>
            {showAnonymous ? "โหมดไม่ระบุตัวตน" : "แสดงชื่อนักเรียน"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase tracking-wide pr-4">
                ครู
              </th>
              <th className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase tracking-wide pr-4">
                นักเรียน
              </th>
              <th className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase tracking-wide pr-4">
                ช่วงประเมิน
              </th>
              <th className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase tracking-wide">
                สถานะ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-base-black/40 text-sm">
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-primary">{row.teacher?.full_name ?? "—"}</div>
                    <div className="text-xs text-base-black/40 font-mono">{row.teacher?.employee_id}</div>
                  </td>
                  <td className="py-3 pr-4">
                    {showAnonymous ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-base-black/30 text-xs italic">ปิดบังตัวตน</span>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium text-base-black">{row.student?.full_name ?? "—"}</div>
                        <div className="text-xs text-base-black/40 font-mono">{row.student?.student_number}</div>
                      </>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-base-black/60 text-xs">
                    {row.period?.title ?? "—"}
                  </td>
                  <td className="py-3">
                    {row.is_submitted ? (
                      <div>
                        <span className="badge-done">ส่งแล้ว</span>
                        {row.submitted_at && (
                          <div className="text-xs text-base-black/40 mt-1">
                            {formatDate(row.submitted_at)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="badge-pending">รอส่ง</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
