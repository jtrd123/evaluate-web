"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Teacher { id: string; full_name: string; employee_id: string | null; subject: string | null; }
interface Student { id: string; full_name: string; student_number: string | null; class_id?: string | null; }

function deriveGrade(className: string): string {
  const m = className.match(/^(ม\.\d+)/);
  return m ? m[1] : className;
}
interface Form { id: string; title: string; }
interface Period { id: string; title: string; end_at: string; academic_year?: string | null; }
interface Class { id: string; name: string; academic_year: string; }
interface Assignment {
  id: string;
  created_at: string;
  student: { id: string; full_name: string; student_number: string | null } | null;
  teacher: { id: string; full_name: string; employee_id: string | null; subject: string | null } | null;
  form: { id: string; title: string } | null;
  period: { id: string; title: string; academic_year?: string | null } | null;
  class: { id: string; name: string } | null;
}

interface Props {
  teachers: Teacher[];
  students: Student[];
  forms: Form[];
  periods: Period[];
  classes: Class[];
  yearFilter: string;
  initialAssignments: Assignment[];
}

export default function AssignmentManager({ teachers, students, forms, periods, classes, yearFilter, initialAssignments }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Form state
  const [sel, setSel] = useState({
    student_id: "",
    teacher_id: "",
    form_id: "",
    period_id: "",
    class_id: "",
  });

  // Bulk mode: one teacher → many students (with grade filter)
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkStudentIds, setBulkStudentIds] = useState<string[]>([]);
  const [gradeFilter, setGradeFilter] = useState("");

  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  const grades = useMemo(() => {
    const seen = new Set<string>();
    for (const c of classes) seen.add(deriveGrade(c.name));
    return Array.from(seen).sort((a, b) => a.localeCompare(b, "th"));
  }, [classes]);

  const visibleStudents = useMemo(() => {
    if (!gradeFilter) return students;
    return students.filter((s) => {
      const cls = s.class_id ? classMap.get(s.class_id) : null;
      return cls && deriveGrade(cls.name) === gradeFilter;
    });
  }, [students, gradeFilter, classMap]);

  function toggleBulkStudent(id: string) {
    setBulkStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function selectGrade(grade: string) {
    setGradeFilter(grade);
    const ids = students
      .filter((s) => {
        const cls = s.class_id ? classMap.get(s.class_id) : null;
        return cls && deriveGrade(cls.name) === grade;
      })
      .map((s) => s.id);
    setBulkStudentIds(ids);
  }

  async function handleAdd() {
    const { student_id, teacher_id, form_id, period_id } = sel;
    const ids = bulkMode ? bulkStudentIds : [student_id];

    if (ids.length === 0 || !teacher_id || !form_id || !period_id) {
      setError("กรุณาเลือกครู, นักเรียน, แบบฟอร์ม และช่วงประเมินให้ครบ");
      return;
    }
    setSaving(true);
    setError(null);

    const studentMap = new Map(students.map((s) => [s.id, s]));
    const rows = ids.map((sid) => ({
      student_id: sid,
      teacher_id,
      form_id,
      period_id,
      // In bulk mode use each student's own class; single mode uses manually selected class
      class_id: bulkMode ? (studentMap.get(sid)?.class_id ?? null) : (sel.class_id || null),
    }));

    const { error: err } = await supabase.from("teacher_assignments").insert(rows);

    if (err) {
      if (err.code === "23505") {
        setError("มีการจับคู่นี้อยู่แล้วในช่วงประเมินนี้");
      } else {
        setError("เกิดข้อผิดพลาด: " + err.message);
      }
      setSaving(false);
      return;
    }

    setShowAdd(false);
    setBulkStudentIds([]);
    setGradeFilter("");
    setSel({ student_id: "", teacher_id: "", form_id: "", period_id: "", class_id: "" });
    router.refresh();
    const { data } = await supabase
      .from("teacher_assignments")
      .select(`id, created_at,
        student:profiles!teacher_assignments_student_id_fkey (id, full_name, student_number),
        teacher:profiles!teacher_assignments_teacher_id_fkey (id, full_name, employee_id, subject),
        form:evaluation_forms!teacher_assignments_form_id_fkey (id, title),
        period:evaluation_periods!teacher_assignments_period_id_fkey (id, title, academic_year),
        class:classes (id, name)`)
      .order("created_at", { ascending: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAssignments((data ?? []) as any);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await supabase.from("teacher_assignments").delete().eq("id", id);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    setDeletingId(null);
  }

  // Filter by search + year
  const filtered = assignments.filter((a) => {
    if (yearFilter && a.period?.academic_year !== yearFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.teacher?.full_name.toLowerCase().includes(q) ||
      a.student?.full_name.toLowerCase().includes(q) ||
      a.student?.student_number?.toLowerCase().includes(q)
    );
  });

  // Group by academic year when no year filter selected
  const grouped = new Map<string, Assignment[]>();
  for (const a of filtered) {
    const yr = a.period?.academic_year ?? "ไม่ระบุปี";
    if (!grouped.has(yr)) grouped.set(yr, []);
    grouped.get(yr)!.push(a);
  }
  const sortedYears = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  const selectCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-base-white";

  function AssignmentTable({ rows }: { rows: Assignment[] }) {
    return (
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-100">
              {["ครู", "นักเรียน", "ชั้น", "แบบฟอร์ม", "ช่วงประเมิน", ""].map((h) => (
                <th key={h} className="text-left pb-3 text-xs font-semibold text-base-black/40 uppercase tracking-wide pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-base-black/40 text-sm">ไม่พบข้อมูล</td></tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-primary text-sm">{a.teacher?.full_name ?? "—"}</div>
                    {a.teacher?.subject && <div className="text-xs text-base-black/40">{a.teacher.subject}</div>}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="text-sm">{a.student?.full_name ?? "—"}</div>
                    {a.student?.student_number && <div className="text-xs text-base-black/40 font-mono">{a.student.student_number}</div>}
                  </td>
                  <td className="py-3 pr-4 text-xs text-base-black/50">{a.class?.name ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <span className="text-xs bg-primary/8 text-primary px-2.5 py-1 rounded-full font-medium">{a.form?.title ?? "—"}</span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-base-black/50">{a.period?.title ?? "—"}</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="ลบการจับคู่"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อครู / นักเรียน..."
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          onClick={() => setShowAdd((p) => !p)}
          className="inline-flex items-center gap-2 bg-accent text-primary font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm hover:bg-accent/90 transition-all shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          เพิ่มการจับคู่
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card mb-6 border-2 border-accent/30 bg-accent/5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-primary">เพิ่มการจับคู่ใหม่</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => { setBulkMode((p) => !p); setBulkStudentIds([]); setGradeFilter(""); }}
                className={`w-10 h-5 rounded-full transition-colors ${bulkMode ? "bg-primary" : "bg-gray-300"} relative`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${bulkMode ? "translate-x-5" : ""}`} />
              </div>
              <span className="text-sm text-base-black/60">เลือกนักเรียนหลายคน</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-base-black/60 mb-1">ครู *</label>
              <select value={sel.teacher_id} onChange={(e) => setSel((p) => ({ ...p, teacher_id: e.target.value }))} className={selectCls}>
                <option value="">-- เลือกครู --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} {t.employee_id ? `(${t.employee_id})` : ""} {t.subject ? `- ${t.subject}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {!bulkMode ? (
              <div>
                <label className="block text-xs font-semibold text-base-black/60 mb-1">นักเรียน *</label>
                <select value={sel.student_id} onChange={(e) => setSel((p) => ({ ...p, student_id: e.target.value }))} className={selectCls}>
                  <option value="">-- เลือกนักเรียน --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} {s.student_number ? `(${s.student_number})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="sm:col-span-2">
                {/* Grade quick-select bar */}
                {grades.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => { setGradeFilter(""); setBulkStudentIds([]); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${!gradeFilter ? "bg-primary text-white" : "bg-gray-100 text-base-black/60 hover:bg-gray-200"}`}
                    >
                      ทั้งหมด
                    </button>
                    {grades.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => selectGrade(g)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${gradeFilter === g ? "bg-primary text-white" : "bg-gray-100 text-base-black/60 hover:bg-gray-200"}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}

                <label className="block text-xs font-semibold text-base-black/60 mb-1">
                  นักเรียน *{" "}
                  <span className="text-primary">({bulkStudentIds.length} คนที่เลือก)</span>
                  {visibleStudents.length > 0 && bulkStudentIds.length < visibleStudents.length && (
                    <button
                      type="button"
                      onClick={() => setBulkStudentIds(visibleStudents.map((s) => s.id))}
                      className="ml-2 text-primary/70 underline hover:text-primary"
                    >
                      เลือกทั้งหมด {visibleStudents.length} คน
                    </button>
                  )}
                </label>

                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto bg-base-white">
                  {(() => {
                    // Group visible students by class
                    const byClass = new Map<string, Student[]>();
                    for (const s of visibleStudents) {
                      const key = s.class_id ?? "__none__";
                      if (!byClass.has(key)) byClass.set(key, []);
                      byClass.get(key)!.push(s);
                    }
                    const classKeys = Array.from(byClass.keys()).sort((a, b) => {
                      const na = a !== "__none__" ? (classMap.get(a)?.name ?? a) : "zzz";
                      const nb = b !== "__none__" ? (classMap.get(b)?.name ?? b) : "zzz";
                      return na.localeCompare(nb, "th");
                    });
                    return classKeys.map((key) => {
                      const cls = key !== "__none__" ? classMap.get(key) : null;
                      const studs = byClass.get(key)!;
                      return (
                        <div key={key}>
                          {(classKeys.length > 1 || !gradeFilter) && (
                            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-100 sticky top-0">
                              <span className="text-[11px] font-bold text-primary/70">{cls?.name ?? "ไม่ระบุห้อง"}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const ids = studs.map((s) => s.id);
                                  const allChecked = ids.every((id) => bulkStudentIds.includes(id));
                                  setBulkStudentIds((prev) =>
                                    allChecked ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]
                                  );
                                }}
                                className="text-[11px] text-primary underline"
                              >
                                {studs.every((s) => bulkStudentIds.includes(s.id)) ? "ยกเลิกทั้งห้อง" : `เลือกทั้งห้อง (${studs.length})`}
                              </button>
                            </div>
                          )}
                          {studs.map((s) => (
                            <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                              <input
                                type="checkbox"
                                checked={bulkStudentIds.includes(s.id)}
                                onChange={() => toggleBulkStudent(s.id)}
                                className="accent-primary"
                              />
                              <span className="text-sm flex-1">{s.full_name}</span>
                              {s.student_number && <span className="text-xs text-base-black/40 font-mono">{s.student_number}</span>}
                            </label>
                          ))}
                        </div>
                      );
                    });
                  })()}
                  {visibleStudents.length === 0 && (
                    <div className="px-3 py-6 text-center text-xs text-base-black/40">ไม่มีนักเรียนในชั้นนี้</div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-base-black/60 mb-1">แบบฟอร์ม *</label>
              <select value={sel.form_id} onChange={(e) => setSel((p) => ({ ...p, form_id: e.target.value }))} className={selectCls}>
                <option value="">-- เลือกแบบฟอร์ม --</option>
                {forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-base-black/60 mb-1">ช่วงประเมิน *</label>
              <select value={sel.period_id} onChange={(e) => setSel((p) => ({ ...p, period_id: e.target.value }))} className={selectCls}>
                <option value="">-- เลือกช่วงประเมิน --</option>
                {periods.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            {!bulkMode && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-base-black/60 mb-1">ชั้นเรียน (ไม่บังคับ)</label>
                <select value={sel.class_id} onChange={(e) => setSel((p) => ({ ...p, class_id: e.target.value }))} className={selectCls}>
                  <option value="">-- ไม่ระบุ --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.academic_year})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => { setShowAdd(false); setError(null); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50">
              ยกเลิก
            </button>
            <button onClick={handleAdd} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-accent text-primary font-bold text-sm hover:bg-accent/90 disabled:opacity-50">
              {saving ? "กำลังบันทึก..." : bulkMode ? `เพิ่ม ${bulkStudentIds.length} คน` : "เพิ่มการจับคู่"}
            </button>
          </div>
        </div>
      )}

      {/* Assignment table — grouped by year when no filter selected */}
      {yearFilter ? (
        // Single filtered year
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-base-black/50">{filtered.length} รายการ · ปีการศึกษา {yearFilter}</p>
          </div>
          <AssignmentTable rows={filtered} />
        </div>
      ) : (
        // All years — grouped
        sortedYears.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <div className="text-5xl mb-4">👥</div>
            <p className="font-bold text-primary text-base mb-1">ยังไม่มีการจับคู่ครู-นักเรียน</p>
            <p className="text-sm text-base-black/50 mb-5">จับคู่เพื่อให้นักเรียนสามารถประเมินครูได้</p>
            <div className="flex flex-col gap-2 text-xs text-base-black/40">
              <span>✅ ต้องมีครูและนักเรียนในระบบก่อน</span>
              <span>✅ ต้องมีแบบฟอร์มและรอบประเมินก่อน</span>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {sortedYears.map((yr) => {
              const rows = grouped.get(yr)!;
              return (
                <div key={yr} className="card overflow-hidden">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-primary text-sm">ปีการศึกษา {yr}</h3>
                    <span className="text-xs text-base-black/40 bg-gray-100 px-2 py-0.5 rounded-full">{rows.length} รายการ</span>
                  </div>
                  <AssignmentTable rows={rows} />
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
