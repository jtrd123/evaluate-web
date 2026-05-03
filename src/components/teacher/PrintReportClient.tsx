"use client";

import { useEffect } from "react";
import type { QuestionStat } from "@/lib/types/database.types";

interface Profile {
  full_name: string;
  subject?: string;
  employee_id?: string;
}

interface Props {
  profile: Profile;
  ratingStats: QuestionStat[];
  textComments: string[];
  overallAvg: number | null;
  totalRespondents: number;
  printDate: string;
}

const stars = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

export default function PrintReportClient({
  profile,
  ratingStats,
  textComments,
  overallAvg,
  totalRespondents,
  printDate,
}: Props) {
  useEffect(() => {
    // Auto-trigger print dialog after render
    window.print();
  }, []);

  return (
    <>
      {/* Print styles injected into head */}
      <style>{`
        @media print {
          body { margin: 0; font-family: 'Sarabun', sans-serif; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        body { font-family: 'Sarabun', Arial, sans-serif; color: #1a1a2e; background: white; }
      `}</style>

      {/* Back button — hidden on print */}
      <div className="no-print p-4 border-b bg-white sticky top-0 z-10 flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/70 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          กลับ
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
          พิมพ์ / บันทึก PDF
        </button>
      </div>

      {/* Report content */}
      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
          <p className="text-xs text-gray-400 mb-2">รายงานผลการประเมินการสอน</p>
          <h1 className="text-3xl font-black text-gray-800 mb-1">{profile.full_name}</h1>
          {profile.subject && <p className="text-lg text-gray-500">{profile.subject}</p>}
          {profile.employee_id && <p className="text-sm text-gray-400 font-mono mt-1">รหัส {profile.employee_id}</p>}
          <p className="text-xs text-gray-400 mt-3">วันที่พิมพ์: {printDate}</p>
        </div>

        {/* Summary boxes */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border-2 border-gray-100 rounded-2xl p-4 text-center">
            <div className="text-4xl font-black text-gray-800">
              {overallAvg !== null ? overallAvg.toFixed(2) : "—"}
            </div>
            <div className="text-xs text-gray-400 mt-1">คะแนนเฉลี่ย / 5.00</div>
          </div>
          <div className="border-2 border-gray-100 rounded-2xl p-4 text-center">
            <div className="text-4xl font-black text-gray-800">{totalRespondents}</div>
            <div className="text-xs text-gray-400 mt-1">ผู้ประเมิน</div>
          </div>
          <div className="border-2 border-gray-100 rounded-2xl p-4 text-center">
            <div className="text-4xl font-black text-gray-800">{textComments.length}</div>
            <div className="text-xs text-gray-400 mt-1">ข้อเสนอแนะ</div>
          </div>
        </div>

        {/* Rating table */}
        {ratingStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-gray-700 mb-3">คะแนนแต่ละด้าน</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 text-gray-500 font-semibold border border-gray-200 w-8">#</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-semibold border border-gray-200">คำถาม</th>
                  <th className="text-center px-3 py-2 text-gray-500 font-semibold border border-gray-200 w-28">คะแนน</th>
                  <th className="text-center px-3 py-2 text-gray-500 font-semibold border border-gray-200 w-24">จำนวนผู้ตอบ</th>
                </tr>
              </thead>
              <tbody>
                {ratingStats.map((s, i) => (
                  <tr key={s.question_id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-3 py-2 border border-gray-200 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-3 py-2 border border-gray-200 text-gray-700">{s.question_text}</td>
                    <td className="px-3 py-2 border border-gray-200 text-center">
                      <span className="font-bold text-gray-800">{s.average?.toFixed(2) ?? "—"}</span>
                      {s.average !== null && (
                        <span className="block text-xs text-yellow-500">{stars(s.average)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 border border-gray-200 text-center text-gray-500">{s.responses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Comments */}
        {textComments.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-700 mb-3">
              ข้อเสนอแนะจากนักเรียน
              <span className="ml-2 text-xs font-normal text-gray-400">(ไม่ระบุชื่อ)</span>
            </h2>
            <div className="space-y-2">
              {textComments.map((c, i) => (
                <div key={i} className="flex gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-300 font-mono text-sm shrink-0">{i + 1}.</span>
                  <p className="text-sm text-gray-600 leading-relaxed">{c}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {ratingStats.length === 0 && textComments.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p>ยังไม่มีผลการประเมิน</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-300">สร้างโดยระบบประเมินการสอน • ข้อมูลเป็นความลับ</p>
        </div>
      </div>
    </>
  );
}
