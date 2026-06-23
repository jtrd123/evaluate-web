"use client";

import { useState, useEffect, useCallback } from "react";

interface Period { id: string; title: string; }
interface ClassItem { id: string; name: string; academic_year: string; }

interface Relationship {
  id: string;
  class_id: string;
  teacher_id: string;
  class: { id: string; name: string; academic_year: string } | null;
  teacher: { id: string; full_name: string; employee_id: string | null } | null;
}

interface Props {
  periods: Period[];
  classes: ClassItem[];
  studentCounts: Record<string, number>;
}

export default function ClassTeacherView({ periods, classes, studentCounts }: Props) {
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchRelationships = useCallback(async (pid: string) => {
    if (!pid) return;
    setLoading(true);
    const res = await fetch(`/api/admin/class-assign?period_id=${pid}`);
    const data = await res.json();
    setRelationships(data.relationships ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRelationships(periodId); }, [periodId, fetchRelationships]);

  async function handleRemove(id: string) {
    setRemovingId(id);
    await fetch("/api/admin/class-assign", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setRelationships((prev) => prev.filter((r) => r.id !== id));
    setRemovingId(null);
  }

  // Group by class, preserving class order from the classes list
  const teachersByClass = new Map<string, Relationship[]>();
  for (const r of relationships) {
    if (!r.class_id) continue;
    if (!teachersByClass.has(r.class_id)) teachersByClass.set(r.class_id, []);
    teachersByClass.get(r.class_id)!.push(r);
  }

  const coveredCount = classes.filter((c) => (teachersByClass.get(c.id)?.length ?? 0) > 0).length;
  const uncoveredCount = classes.length - coveredCount;

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-primary">ความสัมพันธ์ห้อง–ครู</h2>
          <p className="text-sm text-base-black/50 mt-0.5">ห้องไหนประเมินครูคนไหนบ้าง</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {uncoveredCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008z" />
              </svg>
              ยังไม่มีครู {uncoveredCount} ห้อง
            </span>
          )}
          <select
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          >
            {periods.length === 0 && <option value="">ยังไม่มีรอบประเมิน</option>}
            {periods.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      </div>

      {periods.length === 0 ? (
        <div className="py-10 text-center text-base-black/40 text-sm">ยังไม่มีรอบการประเมิน</div>
      ) : loading ? (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className="py-10 text-center text-base-black/40 text-sm">ยังไม่มีห้องเรียน</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-base-black/40 w-24">ห้อง</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-base-black/40 w-20">นักเรียน</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-base-black/40">ครูที่ประเมิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {classes.map((cls) => {
                const teachers = teachersByClass.get(cls.id) ?? [];
                const hasTeachers = teachers.length > 0;
                return (
                  <tr key={cls.id} className={hasTeachers ? "hover:bg-gray-50/60" : "bg-amber-50/60"}>
                    <td className="px-4 py-2.5 font-semibold text-primary whitespace-nowrap">{cls.name}</td>
                    <td className="px-4 py-2.5 text-base-black/50 text-xs whitespace-nowrap">
                      {studentCounts[cls.id] ?? 0} คน
                    </td>
                    <td className="px-4 py-2.5">
                      {hasTeachers ? (
                        <div className="flex flex-wrap gap-1.5">
                          {teachers.map((r) => (
                            <span key={r.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-100 text-base-black/70 border border-gray-200">
                              {r.teacher?.full_name ?? "—"}
                              <button
                                onClick={() => handleRemove(r.id)}
                                disabled={removingId === r.id}
                                className="text-base-black/30 hover:text-red-500 transition-colors ml-0.5 disabled:opacity-40"
                                title="ลบการจับคู่นี้"
                              >
                                {removingId === r.id ? (
                                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                          ยังไม่มีครู — นักเรียนจะไม่เห็นแบบประเมิน
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
  );
}
