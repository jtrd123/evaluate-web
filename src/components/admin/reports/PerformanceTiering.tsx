"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import type { TeacherScore } from "./ReportsDashboard";

interface ClassScore { classId: string; className: string; average: number; count: number; }

interface Props {
  teacherScores: TeacherScore[];
  classScores: ClassScore[];
}

const THRESHOLD = 3.0;

const MEDALS = ["🥇", "🥈", "🥉"];

function ScoreBadge({ value }: { value: number }) {
  const cls = value >= 4 ? "bg-green-100 text-green-700" : value >= 3 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return (
    <span className={`text-sm font-black px-3 py-1 rounded-xl ${cls}`}>{value.toFixed(2)}</span>
  );
}

export default function PerformanceTiering({ teacherScores, classScores }: Props) {
  const [threshold, setThreshold] = useState(THRESHOLD);

  const top5 = teacherScores.slice(0, 5);
  const belowThreshold = teacherScores.filter((t) => t.average < threshold);
  const chartData = classScores.map((c) => ({
    name: c.className,
    value: c.average,
    count: c.count,
  }));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top 5 */}
      <div className="card">
        <h3 className="font-bold text-primary mb-5 flex items-center gap-2">
          🏆 ครูที่ได้คะแนนสูงสุด 5 อันดับ
        </h3>

        {top5.length === 0 ? (
          <p className="text-sm text-base-black/40 text-center py-8">ยังไม่มีข้อมูลคะแนน</p>
        ) : (
          <div className="flex flex-col gap-3">
            {top5.map((t, i) => (
              <div key={t.teacherId} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                i === 0 ? "bg-amber-50 border-amber-200" : i === 1 ? "bg-gray-50 border-gray-200" : i === 2 ? "bg-orange-50 border-orange-200" : "bg-base-white border-gray-100"
              }`}>
                <span className="text-2xl w-8 text-center shrink-0">{MEDALS[i] ?? `${i + 1}.`}</span>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-primary">{t.teacherName}</p>
                  <p className="text-xs text-base-black/50 mt-0.5">
                    {t.subject && <span>{t.subject}</span>}
                    {t.employeeId && <span className="ml-2 font-mono">({t.employeeId})</span>}
                    <span className="ml-2">{t.respondents} ผู้ประเมิน</span>
                  </p>
                </div>

                {/* Score bar */}
                <div className="hidden sm:flex items-center gap-3 w-36">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(t.average / 5) * 100}%` }}
                    />
                  </div>
                  <ScoreBadge value={t.average} />
                </div>
                <div className="sm:hidden">
                  <ScoreBadge value={t.average} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Below threshold */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-bold text-primary flex items-center gap-2">
            ⚠️ ครูที่ต้องการการพัฒนา
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-xs text-base-black/50 font-semibold">เกณฑ์:</label>
            <input
              type="number"
              min={1} max={5} step={0.1}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-20 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <span className="text-xs text-base-black/40">/ 5.00</span>
          </div>
        </div>

        {belowThreshold.length === 0 ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl px-5 py-4">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-semibold text-green-700">ครูทุกคนผ่านเกณฑ์ที่กำหนด 🎉</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-96">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase pr-4">ครู</th>
                  <th className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase pr-4">วิชา</th>
                  <th className="text-center pb-3 text-xs font-semibold text-base-black/40 uppercase pr-4">คะแนน</th>
                  <th className="text-center pb-3 text-xs font-semibold text-base-black/40 uppercase">ต่ำกว่าเกณฑ์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {belowThreshold.map((t) => (
                  <tr key={t.teacherId} className="hover:bg-red-50/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-primary">{t.teacherName}</div>
                      {t.employeeId && <div className="text-xs text-base-black/40 font-mono">{t.employeeId}</div>}
                    </td>
                    <td className="py-3 pr-4 text-base-black/60 text-sm">{t.subject ?? "—"}</td>
                    <td className="py-3 pr-4 text-center"><ScoreBadge value={t.average} /></td>
                    <td className="py-3 text-center">
                      <span className="text-xs font-bold text-red-600">
                        -{(threshold - t.average).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Class comparison chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-primary mb-6">📚 เปรียบเทียบคะแนนเฉลี่ยตามชั้นเรียน</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#00000070" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#00000050" }} axisLine={false} tickLine={false} />
              <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="4 3" label={{ value: `เกณฑ์ ${threshold}`, position: "right", fontSize: 11, fill: "#ef4444" }} />
              <Tooltip
                cursor={{ fill: "#2e006b08" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-base-white border border-gray-100 rounded-xl shadow-card p-3">
                      <p className="text-xs text-base-black/50 mb-1">{d.name}</p>
                      <p className="text-primary font-black text-lg">{d.value} <span className="text-xs font-normal text-base-black/40">/ 5.00</span></p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={56}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.value >= threshold ? "#2e006b" : "#ffd445"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-6 mt-4 justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-base-black/50">ผ่านเกณฑ์</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-xs text-base-black/50">ต่ำกว่าเกณฑ์</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-0.5 bg-red-400" style={{ borderTop: "2px dashed #ef4444", background: "transparent" }} />
              <span className="text-xs text-base-black/50">เส้นเกณฑ์ ({threshold})</span>
            </div>
          </div>
        </div>
      )}

      {/* Full ranking table */}
      {teacherScores.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-primary mb-4">ตารางอันดับครูทั้งหมด</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-center pb-3 text-xs font-semibold text-base-black/40 uppercase w-12">#</th>
                  <th className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase pr-4">ครู</th>
                  <th className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase pr-4">วิชา</th>
                  <th className="text-center pb-3 text-xs font-semibold text-base-black/40 uppercase pr-4">คะแนน</th>
                  <th className="text-center pb-3 text-xs font-semibold text-base-black/40 uppercase">ผู้ประเมิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teacherScores.map((t, i) => (
                  <tr key={t.teacherId} className={`hover:bg-gray-50/80 transition-colors ${t.average < threshold ? "bg-red-50/30" : ""}`}>
                    <td className="py-3 text-center">
                      {i < 3 ? (
                        <span className="text-lg">{MEDALS[i]}</span>
                      ) : (
                        <span className="text-sm text-base-black/40 font-mono">{i + 1}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-primary">{t.teacherName}</div>
                      {t.employeeId && <div className="text-xs text-base-black/40 font-mono">{t.employeeId}</div>}
                    </td>
                    <td className="py-3 pr-4 text-base-black/60">{t.subject ?? "—"}</td>
                    <td className="py-3 pr-4 text-center"><ScoreBadge value={t.average} /></td>
                    <td className="py-3 text-center text-base-black/50">{t.respondents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
