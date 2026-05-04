"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { ClassCompletion, StudentProgress } from "./ReportsDashboard";

interface Props {
  overall: { total: number; done: number; pct: number };
  byClass: ClassCompletion[];
  studentProgress: StudentProgress[];
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="card text-center">
      <div className={`text-3xl font-black mb-1 ${color ?? "text-primary"}`}>{value}</div>
      <div className="text-xs font-semibold text-base-black/50">{label}</div>
      {sub && <div className="text-xs text-base-black/30 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function CompletionReport({ overall, byClass, studentProgress }: Props) {
  const [showPending, setShowPending] = useState(false);
  const [classFilter, setClassFilter] = useState("__all__");

  const pieData = [
    { name: "ส่งแล้ว", value: overall.done, color: "#2e006b" },
    { name: "ยังไม่ส่ง", value: overall.total - overall.done, color: "#ffd445" },
  ];

  const pendingStudents = studentProgress.filter((s) => s.completed < s.total);
  const allClasses = Array.from(new Set(studentProgress.map((s) => s.className).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "th"));

  const filteredStudents = (showPending ? pendingStudents : studentProgress)
    .filter((s) => classFilter === "__all__" || s.className === classFilter);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="มอบหมายทั้งหมด" value={overall.total} />
        <StatCard label="ส่งแล้ว" value={overall.done} color="text-green-600" />
        <StatCard label="ยังไม่ส่ง" value={overall.total - overall.done} color="text-amber-600" />
        <StatCard label="อัตราสำเร็จ" value={`${overall.pct}%`} color={overall.pct >= 80 ? "text-green-600" : overall.pct >= 50 ? "text-amber-600" : "text-red-500"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="card">
          <h3 className="font-bold text-primary mb-4">สัดส่วนภาพรวม</h3>
          <div className="flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} ราย`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-primary">{overall.pct}%</span>
                <span className="text-xs text-base-black/40">สำเร็จ</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-3">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                <span className="text-sm text-base-black/60">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* By class */}
        <div className="card">
          <h3 className="font-bold text-primary mb-4">
            แยกตามชั้นเรียน
            <span className="ml-2 text-xs font-normal text-base-black/40">(เรียงจากน้อย→มาก)</span>
          </h3>
          {byClass.length === 0 ? (
            <p className="text-sm text-base-black/40 text-center py-8">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
              {byClass.map((c) => (
                <div key={c.classId ?? "none"}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-base-black">{c.className}</span>
                    <span className={`text-xs font-bold ${c.pct >= 80 ? "text-green-600" : c.pct >= 50 ? "text-amber-600" : "text-red-500"}`}>
                      {c.completed}/{c.total} ({c.pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${c.pct >= 80 ? "bg-green-500" : c.pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alert: low completion classes */}
      {byClass.filter((c) => c.pct < 50 && c.total > 0).length > 0 && (
        <div className="card border-l-4 border-red-400 bg-red-50">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-bold text-red-700 mb-1">ชั้นเรียนที่ยังมีสถิติต่ำ (ต่ำกว่า 50%)</p>
              <div className="flex flex-wrap gap-2">
                {byClass.filter((c) => c.pct < 50 && c.total > 0).map((c) => (
                  <span key={c.classId ?? "none"} className="text-xs bg-red-100 text-red-700 font-semibold px-3 py-1 rounded-full">
                    {c.className} — {c.pct}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student progress table */}
      {studentProgress.length > 0 && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-primary">รายชื่อนักเรียน</h3>
              <p className="text-xs text-base-black/40 mt-0.5">
                {pendingStudents.length > 0
                  ? `ยังไม่ส่งครบ ${pendingStudents.length} คน`
                  : "นักเรียนทุกคนส่งครบแล้ว ✓"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {allClasses.length > 1 && (
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="__all__">ทุกห้อง</option>
                  {allClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              <div className="flex bg-gray-100 rounded-xl p-0.5">
                <button
                  onClick={() => setShowPending(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${!showPending ? "bg-white text-primary shadow-sm" : "text-base-black/50"}`}
                >
                  ทั้งหมด ({studentProgress.length})
                </button>
                <button
                  onClick={() => setShowPending(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${showPending ? "bg-white text-red-600 shadow-sm" : "text-base-black/50"}`}
                >
                  ยังไม่ส่ง ({pendingStudents.length})
                </button>
              </div>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <p className="text-sm text-base-black/40 text-center py-8">
              {showPending ? "นักเรียนทุกคนส่งครบแล้ว 🎉" : "ไม่มีข้อมูล"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase pr-4">ชื่อ-นามสกุล</th>
                    <th className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase pr-4">รหัส</th>
                    <th className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase pr-4">ห้อง</th>
                    <th className="text-center pb-3 text-xs font-semibold text-base-black/40 uppercase pr-4">ส่งแล้ว</th>
                    <th className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStudents.map((s) => {
                    const isDone = s.completed === s.total;
                    return (
                      <tr key={s.studentId} className="hover:bg-gray-50/80">
                        <td className="py-2.5 pr-4 font-medium text-base-black">{s.studentName}</td>
                        <td className="py-2.5 pr-4 text-xs text-base-black/40 font-mono">{s.studentNumber ?? "—"}</td>
                        <td className="py-2.5 pr-4">
                          {s.className
                            ? <span className="text-xs bg-primary/8 text-primary px-2 py-0.5 rounded-full">{s.className}</span>
                            : <span className="text-xs text-base-black/30">—</span>}
                        </td>
                        <td className="py-2.5 pr-4 text-center text-xs text-base-black/60 font-mono">{s.completed}/{s.total}</td>
                        <td className="py-2.5">
                          {isDone ? (
                            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">ครบแล้ว</span>
                          ) : (
                            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
                              ขาด {s.total - s.completed} รายการ
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
