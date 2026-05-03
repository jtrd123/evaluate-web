"use client";

import { useState } from "react";

interface ClassItem { id: string; name: string; academic_year: string; }

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  employee_id: string | null;
  subject: string | null;
  teaching_levels: string | null;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  student_number: string | null;
  class_id: string | null;
  class_name: string | null;
  class_year: string | null;
}

interface Props {
  teachers: Teacher[];
  students: Student[];
  classes: ClassItem[];
}

type Tab = "teachers" | "students";

function ResetPasswordModal({ userId, userName, onClose }: { userId: string; userName: string; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    if (password.length < 6) { setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return; }
    setSaving(true); setError(null);
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        {done ? (
          <>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="font-bold text-base-black">รีเซ็ตรหัสผ่านสำเร็จ</p>
              <p className="text-sm text-base-black/50 text-center">{userName} สามารถ login ด้วยรหัสผ่านใหม่ได้แล้ว</p>
            </div>
            <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90">ปิด</button>
          </>
        ) : (
          <>
            <h3 className="font-bold text-base-black mb-1">รีเซ็ตรหัสผ่าน</h3>
            <p className="text-sm text-base-black/50 mb-4">{userName}</p>
            <label className="text-xs font-semibold text-base-black/60 mb-1 block">รหัสผ่านใหม่</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3"
            />
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleReset} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "รีเซ็ต"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EditTeacherRow({ teacher, onSave, onCancel }: {
  teacher: Teacher;
  onSave: (updated: Teacher) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ full_name: teacher.full_name, employee_id: teacher.employee_id ?? "", subject: teacher.subject ?? "", teaching_levels: teacher.teaching_levels ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true); setError(null);
    const res = await fetch(`/api/admin/users/${teacher.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: form.full_name, employee_id: form.employee_id || null, subject: form.subject || null, teaching_levels: form.teaching_levels || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    onSave({ ...teacher, full_name: data.full_name, employee_id: data.employee_id, subject: data.subject, teaching_levels: data.teaching_levels });
  }

  const inp = "w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  return (
    <tr className="bg-primary/2">
      <td className="px-4 py-2"><input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className={inp} /></td>
      <td className="px-4 py-2"><input value={form.employee_id} onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))} className={inp} placeholder="—" /></td>
      <td className="px-4 py-2"><input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className={inp} placeholder="—" /></td>
      <td className="px-4 py-2"><input value={form.teaching_levels} onChange={(e) => setForm((f) => ({ ...f, teaching_levels: e.target.value }))} className={inp} placeholder="เช่น ม.2, ม.3" /></td>
      <td className="px-4 py-2 text-xs text-base-black/40">{teacher.email}</td>
      <td className="px-4 py-2">
        {error && <p className="text-xs text-red-600 mb-1">{error}</p>}
        <div className="flex gap-1">
          <button onClick={save} disabled={saving} className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-50">{saving ? "..." : "บันทึก"}</button>
          <button onClick={onCancel} className="px-3 py-1 rounded-lg border border-gray-200 text-xs text-base-black/60">ยกเลิก</button>
        </div>
      </td>
    </tr>
  );
}

function EditStudentRow({ student, classes, onSave, onCancel }: {
  student: Student;
  classes: ClassItem[];
  onSave: (updated: Student) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ full_name: student.full_name, student_number: student.student_number ?? "", class_id: student.class_id ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true); setError(null);
    const res = await fetch(`/api/admin/users/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: form.full_name, student_number: form.student_number || null, class_id: form.class_id || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    const cls = classes.find((c) => c.id === form.class_id);
    onSave({ ...student, full_name: data.full_name, student_number: data.student_number, class_id: data.class_id, class_name: cls?.name ?? null, class_year: cls?.academic_year ?? null });
  }

  const inp = "w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  return (
    <tr className="bg-primary/2">
      <td className="px-4 py-2"><input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className={inp} /></td>
      <td className="px-4 py-2"><input value={form.student_number} onChange={(e) => setForm((f) => ({ ...f, student_number: e.target.value }))} className={inp} placeholder="—" /></td>
      <td className="px-4 py-2">
        <select value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))} className={inp}>
          <option value="">-- ไม่ระบุ --</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.academic_year})</option>)}
        </select>
      </td>
      <td className="px-4 py-2 text-xs text-base-black/40">{student.email}</td>
      <td className="px-4 py-2">
        {error && <p className="text-xs text-red-600 mb-1">{error}</p>}
        <div className="flex gap-1">
          <button onClick={save} disabled={saving} className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-50">{saving ? "..." : "บันทึก"}</button>
          <button onClick={onCancel} className="px-3 py-1 rounded-lg border border-gray-200 text-xs text-base-black/60">ยกเลิก</button>
        </div>
      </td>
    </tr>
  );
}

export default function UserManager({ teachers: initTeachers, students: initStudents, classes }: Props) {
  const [tab, setTab] = useState<Tab>("teachers");
  const [teachers, setTeachers] = useState<Teacher[]>(initTeachers);
  const [students, setStudents] = useState<Student[]>(initStudents);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredTeachers = teachers.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.full_name.toLowerCase().includes(q) || t.employee_id?.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q);
  });

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.full_name.toLowerCase().includes(q) || s.student_number?.toLowerCase().includes(q) || s.class_name?.toLowerCase().includes(q);
  });

  const resetUser = resetUserId
    ? ([...teachers, ...students].find((u) => u.id === resetUserId) as { id: string; full_name: string } | undefined)
    : null;

  return (
    <div>
      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
          {(["teachers", "students"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch(""); setEditingId(null); }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-white text-primary shadow-sm" : "text-base-black/50 hover:text-primary"}`}
            >
              {t === "teachers" ? `ครู (${teachers.length})` : `นักเรียน (${students.length})`}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "teachers" ? "ค้นหาครู..." : "ค้นหานักเรียน..."}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {tab === "teachers" ? (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {["ชื่อ-นามสกุล", "รหัสครู", "กลุ่มสาระ", "ชั้นที่สอน", "Email", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-base-black/40 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTeachers.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-base-black/40">ไม่พบข้อมูล</td></tr>
                ) : filteredTeachers.map((t) =>
                  editingId === t.id ? (
                    <EditTeacherRow key={t.id} teacher={t}
                      onSave={(updated) => { setTeachers((prev) => prev.map((x) => x.id === updated.id ? updated : x)); setEditingId(null); }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-primary">{t.full_name}</td>
                      <td className="px-4 py-3 text-base-black/50 font-mono text-xs">{t.employee_id ?? "—"}</td>
                      <td className="px-4 py-3 text-base-black/70">{t.subject ?? "—"}</td>
                      <td className="px-4 py-3 text-base-black/50 text-xs">{t.teaching_levels ?? "—"}</td>
                      <td className="px-4 py-3 text-base-black/40 text-xs">{t.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditingId(t.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/8 transition-colors" title="แก้ไข">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                          </button>
                          <button onClick={() => setResetUserId(t.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="รีเซ็ตรหัสผ่าน">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {["ชื่อ-นามสกุล", "รหัสนักเรียน", "ห้องเรียน", "Email", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-base-black/40 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-base-black/40">ไม่พบข้อมูล</td></tr>
                ) : filteredStudents.map((s) =>
                  editingId === s.id ? (
                    <EditStudentRow key={s.id} student={s} classes={classes}
                      onSave={(updated) => { setStudents((prev) => prev.map((x) => x.id === updated.id ? updated : x)); setEditingId(null); }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-primary">{s.full_name}</td>
                      <td className="px-4 py-3 text-base-black/50 font-mono text-xs">{s.student_number ?? "—"}</td>
                      <td className="px-4 py-3">
                        {s.class_name
                          ? <span className="text-xs bg-primary/8 text-primary px-2 py-0.5 rounded-full">{s.class_name} ({s.class_year})</span>
                          : <span className="text-xs text-base-black/30">—</span>}
                      </td>
                      <td className="px-4 py-3 text-base-black/40 text-xs">{s.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditingId(s.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/8 transition-colors" title="แก้ไข">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                          </button>
                          <button onClick={() => setResetUserId(s.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="รีเซ็ตรหัสผ่าน">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resetUserId && resetUser && (
        <ResetPasswordModal userId={resetUserId} userName={resetUser.full_name} onClose={() => setResetUserId(null)} />
      )}
    </div>
  );
}
