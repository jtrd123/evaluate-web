"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ClassItem { id: string; name: string; academic_year: string; }

type UserRole = "admin" | "teacher" | "student";

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  employee_id: string | null;
  subject: string | null;
  teaching_levels: string | null;
  academic_year: string | null;
  role: UserRole;
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

function DeleteConfirmModal({ userId, userName, onClose, onDeleted }: { userId: string; userName: string; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true); setError(null);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(false);
    if (!res.ok) { setError(data.error); return; }
    onDeleted();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="font-bold text-base-black text-center mb-1">ลบผู้ใช้งาน?</h3>
        <p className="text-sm text-base-black/60 text-center mb-1">{userName}</p>
        <p className="text-xs text-red-600 text-center mb-5">การดำเนินการนี้ไม่สามารถยกเลิกได้ ข้อมูลและประวัติทั้งหมดจะถูกลบถาวร</p>
        {error && <p className="text-xs text-red-600 mb-3 text-center">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50">ยกเลิก</button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50">
            {deleting ? "กำลังลบ..." : "ลบถาวร"}
          </button>
        </div>
      </div>
    </div>
  );
}

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

function AddTeacherModal({ onClose, onAdded }: { onClose: () => void; onAdded: (t: Teacher) => void }) {
  const [form, setForm] = useState({ full_name: "", employee_id: "", ms_email: "", subject: "", teaching_levels: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ email: string } | null>(null);

  async function handleSave() {
    setSaving(true); setError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: "teacher" }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    onAdded({
      id: data.user.id,
      full_name: data.user.full_name,
      email: data.email,
      employee_id: data.user.employee_id ?? null,
      subject: data.user.subject ?? null,
      teaching_levels: data.user.teaching_levels ?? null,
      academic_year: data.user.academic_year ?? null,
      role: "teacher",
    });
    setDone({ email: data.email });
  }

  const inp = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

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
              <p className="font-bold text-base-black">เพิ่มครูสำเร็จ</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-center w-full">
                <p className="text-xs text-base-black/50 mb-1">ข้อมูล Login</p>
                <p className="text-sm font-mono font-bold text-primary">{done.email}</p>
                <p className="text-sm font-mono text-base-black/60">{form.password}</p>
              </div>
            </div>
            <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90">ปิด</button>
          </>
        ) : (
          <>
            <h3 className="font-bold text-base-black mb-5">เพิ่มครูทีละคน</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-base-black/60 mb-1 block">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                <input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="เช่น นายสมชาย ใจดี" className={inp} />
              </div>
              <div>
                <label className="text-xs font-semibold text-base-black/60 mb-1 block">รหัสครู <span className="text-red-500">*</span></label>
                <input value={form.employee_id} onChange={(e) => setForm(f => ({ ...f, employee_id: e.target.value }))} placeholder="เช่น T0001" className={inp} />
              </div>
              <div>
                <label className="text-xs font-semibold text-base-black/60 mb-1 block">Microsoft 365 Email <span className="text-red-500">*</span></label>
                <input value={form.ms_email} onChange={(e) => setForm(f => ({ ...f, ms_email: e.target.value }))} placeholder="เช่น somchai.jai@sukhon.ac.th" className={inp} type="email" />
                <p className="text-xs text-base-black/40 mt-1 ml-1">ใช้เป็น Email login ทั้ง password และ Microsoft SSO</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-base-black/60 mb-1 block">กลุ่มสาระ</label>
                <input value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="เช่น วิทยาศาสตร์และเทคโนโลยี" className={inp} />
              </div>
              <div>
                <label className="text-xs font-semibold text-base-black/60 mb-1 block">ชั้นที่สอน</label>
                <input value={form.teaching_levels} onChange={(e) => setForm(f => ({ ...f, teaching_levels: e.target.value }))} placeholder="เช่น ม.2, ม.3, ม.4" className={inp} />
              </div>
              <div>
                <label className="text-xs font-semibold text-base-black/60 mb-1 block">รหัสผ่าน <span className="text-red-500">*</span></label>
                <input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="อย่างน้อย 6 ตัวอักษร" className={inp} />
              </div>
            </div>
            {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "เพิ่มครู"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AddStudentModal({ classes, onClose, onAdded }: { classes: ClassItem[]; onClose: () => void; onAdded: (s: Student) => void }) {
  const [form, setForm] = useState({ full_name: "", student_number: "", class_id: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ email: string } | null>(null);

  async function handleSave() {
    setSaving(true); setError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: "student" }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    const cls = classes.find((c) => c.id === form.class_id);
    onAdded({
      id: data.user.id,
      full_name: data.user.full_name,
      email: data.email,
      student_number: data.user.student_number ?? null,
      class_id: data.user.class_id ?? null,
      class_name: cls?.name ?? null,
      class_year: cls?.academic_year ?? null,
    });
    setDone({ email: data.email });
  }

  const inp = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

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
              <p className="font-bold text-base-black">เพิ่มนักเรียนสำเร็จ</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-center w-full">
                <p className="text-xs text-base-black/50 mb-1">ข้อมูล Login</p>
                <p className="text-sm font-mono font-bold text-primary">{done.email}</p>
                <p className="text-sm font-mono text-base-black/60">{form.password}</p>
              </div>
            </div>
            <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90">ปิด</button>
          </>
        ) : (
          <>
            <h3 className="font-bold text-base-black mb-5">เพิ่มนักเรียนทีละคน</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-base-black/60 mb-1 block">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                <input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="เช่น เด็กชายสมชาย ใจดี" className={inp} />
              </div>
              <div>
                <label className="text-xs font-semibold text-base-black/60 mb-1 block">รหัสนักเรียน <span className="text-red-500">*</span></label>
                <input value={form.student_number} onChange={(e) => setForm(f => ({ ...f, student_number: e.target.value }))} placeholder="เช่น 10001" className={inp} />
                {form.student_number && <p className="text-xs text-base-black/40 mt-1 ml-1">Email: {form.student_number}@sukhon.ac.th</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-base-black/60 mb-1 block">ห้องเรียน</label>
                <select value={form.class_id} onChange={(e) => setForm(f => ({ ...f, class_id: e.target.value }))} className={inp}>
                  <option value="">-- ไม่ระบุ --</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.academic_year})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-base-black/60 mb-1 block">รหัสผ่าน <span className="text-red-500">*</span></label>
                <input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="อย่างน้อย 6 ตัวอักษร" className={inp} />
              </div>
            </div>
            {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "เพิ่มนักเรียน"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "ผู้ดูแลระบบ",
  teacher: "ครูผู้สอน",
  student: "นักเรียน",
};

function ChangeRoleModal({ userId, userName, currentRole, onClose, onChanged }: {
  userId: string; userName: string; currentRole: UserRole;
  onClose: () => void; onChanged: (newRole: UserRole) => void;
}) {
  const [selected, setSelected] = useState<UserRole>(currentRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (selected === currentRole) { onClose(); return; }
    setSaving(true); setError(null);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: selected }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    onChanged(selected);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="font-bold text-base-black mb-1">เปลี่ยนสิทธิ์ผู้ใช้งาน</h3>
        <p className="text-sm text-base-black/50 mb-5">{userName}</p>

        <div className="flex flex-col gap-2 mb-5">
          {(["admin", "teacher", "student"] as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => setSelected(role)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                selected === role
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-100 hover:border-gray-200 text-base-black/70"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selected === role ? "border-primary" : "border-gray-300"}`}>
                {selected === role && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <div>
                <p className="text-sm font-bold">{ROLE_LABELS[role]}</p>
                {role === "admin" && <p className="text-xs text-base-black/40">เข้าถึงได้ทุกส่วนของระบบ</p>}
                {role === "teacher" && <p className="text-xs text-base-black/40">ดูรายการและผลประเมินของตัวเอง</p>}
                {role === "student" && <p className="text-xs text-base-black/40">ส่งแบบประเมินเท่านั้น</p>}
              </div>
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50">
            ยกเลิก
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkDeleteModal({ year, role, count, onClose, onDeleted }: {
  year: string | null; role: "teacher" | "student"; count: number;
  onClose: () => void; onDeleted: (removed: number) => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ profilesRemoved: number; deleted: number } | null>(null);
  const CONFIRM_WORD = "ลบทั้งหมด";

  async function handleDelete() {
    if (confirmText !== CONFIRM_WORD) return;
    setDeleting(true); setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 58_000); // 58s — just under maxDuration
    try {
      const res = await fetch("/api/admin/users/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, role }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      setDeleting(false);
      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาด");
        return;
      }
      // Show warning if some auth deletions failed (profiles still deleted — data is gone)
      if ((data.authErrors?.length ?? 0) > 0) {
        console.warn("auth deletion errors:", data.authErrors);
      }
      setResult({ profilesRemoved: data.profilesRemoved ?? 0, deleted: data.deleted ?? 0 });
    } catch (err: unknown) {
      clearTimeout(timeout);
      setDeleting(false);
      if (err instanceof Error && err.name === "AbortError") {
        setError("ใช้เวลานานเกินไป (>58 วิ) — กด refresh แล้วลองใหม่");
      } else {
        setError("เชื่อมต่อ server ไม่ได้ — ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
      }
      console.error("bulk-delete error:", err);
    }
  }

  const label = role === "teacher" ? "ครู" : "นักเรียน";
  const title = year ? `ลบ${label}ปีการศึกษา ${year}?` : `ลบ${label}ทั้งหมด?`;
  const subtitle = year
    ? `${label}ในปีการศึกษา ${year} จำนวน ${count} คน จะถูกลบออก`
    : `${label}ทั้งหมด ${count} คน (ทุกปีการศึกษา) จะถูกลบออก`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        {result ? (
          <>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="font-bold text-base-black text-center mb-1">ลบเสร็จสิ้น</h3>
            <p className="text-sm text-center text-base-black/60 mb-1">
              ลบข้อมูล <span className="font-bold text-primary">{result.profilesRemoved}</span> คนออกจากระบบแล้ว
            </p>
            <p className="text-xs text-center text-base-black/40 mb-4">auth accounts ที่ถูกลบ: {result.deleted} คน</p>
            <button onClick={() => { onDeleted(result.profilesRemoved); onClose(); }} className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all">ปิด</button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="font-bold text-base-black text-center mb-1">{title}</h3>
            <p className="text-sm text-base-black/60 text-center mb-1">{subtitle}</p>
            <p className="text-xs text-red-600 text-center mb-4">การดำเนินการนี้ไม่สามารถยกเลิกได้ ข้อมูลและประวัติทั้งหมดจะถูกลบถาวร</p>
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-4">
              <p className="text-xs text-base-black/50 mb-1.5">พิมพ์ <span className="font-mono font-bold text-base-black">{CONFIRM_WORD}</span> เพื่อยืนยัน</p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_WORD}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 bg-white"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">
                <p className="text-xs text-red-700 text-center">{error}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={onClose} disabled={deleting} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50 disabled:opacity-40">ยกเลิก</button>
              <button onClick={handleDelete} disabled={deleting || confirmText !== CONFIRM_WORD} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-40 transition-all">
                {deleting ? "กำลังลบ..." : `ลบ ${count} คน`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BatchResetModal({ year, count, onClose }: {
  year: string | null; count: number; onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ reset: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setLoading(true); setError(null);
    const res = await fetch("/api/admin/users/batch-reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "เกิดข้อผิดพลาด"); return; }
    setResult(data);
  }

  const scope = year ? `ปีการศึกษา ${year} (${count} คน)` : `นักเรียนทั้งหมด ${count} คน`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
        </div>

        {result ? (
          <>
            <h3 className="font-bold text-base-black text-center mb-2">รีเซ็ตเสร็จสิ้น</h3>
            <p className="text-sm text-center text-base-black/60 mb-1">รีเซ็ตสำเร็จ <span className="font-bold text-primary">{result.reset} คน</span></p>
            {result.skipped > 0 && (
              <p className="text-xs text-center text-amber-600 mb-3">ข้าม {result.skipped} คน (ไม่มีรหัสนักเรียน)</p>
            )}
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all mt-2">ปิด</button>
          </>
        ) : (
          <>
            <h3 className="font-bold text-base-black text-center mb-1">รีเซ็ตรหัสผ่านนักเรียน</h3>
            <p className="text-sm text-base-black/60 text-center mb-1">{scope}</p>
            <p className="text-xs text-base-black/40 text-center mb-4">รหัสผ่านใหม่จะถูกตั้งเป็น <span className="font-mono font-bold text-base-black/60">รหัสนักเรียน</span> ของแต่ละคน</p>
            {error && <p className="text-xs text-red-600 mb-3 text-center">{error}</p>}
            <div className="flex gap-2">
              <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleReset} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-40 transition-all">
                {loading ? "กำลังรีเซ็ต..." : "รีเซ็ตรหัสผ่าน"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function UserManager({ teachers: initTeachers, students: initStudents, classes }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("teachers");
  const [teachers, setTeachers] = useState<Teacher[]>(initTeachers);
  const [students, setStudents] = useState<Student[]>(initStudents);

  // Sync state when server re-fetches fresh data
  useEffect(() => { setTeachers(initTeachers); }, [initTeachers]);
  useEffect(() => { setStudents(initStudents); }, [initStudents]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [changeRoleId, setChangeRoleId] = useState<string | null>(null);
  const [bulkDeleteYear, setBulkDeleteYear] = useState<string | null>(null);
  const [bulkDeleteAll, setBulkDeleteAll] = useState(false);
  const [batchResetOpen, setBatchResetOpen] = useState(false);
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("__all__");

  // Derive available years
  const teacherYears = Array.from(new Set(teachers.map((t) => t.academic_year).filter(Boolean) as string[])).sort((a, b) => b.localeCompare(a));
  const studentYears = Array.from(new Set(students.map((s) => s.class_year).filter(Boolean) as string[])).sort((a, b) => b.localeCompare(a));
  const currentYears = tab === "teachers" ? teacherYears : studentYears;

  const filteredTeachers = teachers.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.full_name.toLowerCase().includes(q) || t.employee_id?.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q);
    const matchYear = yearFilter === "__all__" || t.academic_year === yearFilter;
    return matchSearch && matchYear;
  });

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.full_name.toLowerCase().includes(q) || s.student_number?.toLowerCase().includes(q) || s.class_name?.toLowerCase().includes(q);
    const matchYear = yearFilter === "__all__" || s.class_year === yearFilter;
    return matchSearch && matchYear;
  });

  // Count for bulk delete
  const bulkDeleteCount = tab === "teachers"
    ? teachers.filter((t) => t.academic_year === yearFilter).length
    : students.filter((s) => s.class_year === yearFilter).length;

  const resetUser = resetUserId
    ? ([...teachers, ...students].find((u) => u.id === resetUserId) as { id: string; full_name: string } | undefined)
    : null;

  return (
    <div>
      {/* Tabs + search */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
            {(["teachers", "students"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setSearch(""); setEditingId(null); setYearFilter("__all__"); }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-white text-primary shadow-sm" : "text-base-black/50 hover:text-primary"}`}
              >
                {t === "teachers" ? `ครู (${teachers.length})` : `นักเรียน (${students.length})`}
              </button>
            ))}
          </div>
          {tab === "teachers" && (
            <>
              <button onClick={() => setAddingTeacher(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                เพิ่มครู
              </button>
              {teachers.length > 0 && (
                <button onClick={() => setBulkDeleteAll(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 bg-red-50 text-sm font-bold hover:bg-red-100 transition-all shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  ลบครูทั้งหมด
                </button>
              )}
            </>
          )}
          {tab === "students" && (
            <>
              <button onClick={() => setAddingStudent(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                เพิ่มนักเรียน
              </button>
              {students.length > 0 && (
                <>
                  <button onClick={() => setBatchResetOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-blue-200 text-blue-600 bg-blue-50 text-sm font-bold hover:bg-blue-100 transition-all shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                    รีเซ็ตรหัสผ่าน
                  </button>
                  <button onClick={() => setBulkDeleteAll(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 bg-red-50 text-sm font-bold hover:bg-red-100 transition-all shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    ลบนักเรียนทั้งหมด
                  </button>
                </>
              )}
            </>
          )}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "teachers" ? "ค้นหาครู..." : "ค้นหานักเรียน..."}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Year filter tabs */}
        {currentYears.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-base-black/40">ปีการศึกษา:</span>
            <button
              onClick={() => setYearFilter("__all__")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${yearFilter === "__all__" ? "bg-primary text-white" : "bg-gray-100 text-base-black/60 hover:bg-gray-200"}`}
            >
              ทั้งหมด
            </button>
            {currentYears.map((y) => (
              <button
                key={y}
                onClick={() => setYearFilter(y)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${yearFilter === y ? "bg-primary text-white" : "bg-gray-100 text-base-black/60 hover:bg-gray-200"}`}
              >
                {y}
              </button>
            ))}
            {yearFilter !== "__all__" && bulkDeleteCount > 0 && (
              <button
                onClick={() => setBulkDeleteYear(yearFilter)}
                className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                ลบทั้งปี {yearFilter} ({bulkDeleteCount} คน)
              </button>
            )}
          </div>
        )}
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
                          {t.role === "admin" && (
                            <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full mr-1">Admin</span>
                          )}
                          <button onClick={() => setEditingId(t.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/8 transition-colors" title="แก้ไข">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                          </button>
                          <button onClick={() => setChangeRoleId(t.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors" title="เปลี่ยนสิทธิ์">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                          </button>
                          <button onClick={() => setResetUserId(t.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="รีเซ็ตรหัสผ่าน">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                          </button>
                          <button onClick={() => setDeleteUserId(t.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="ลบ">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
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
                          <button onClick={() => setDeleteUserId(s.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="ลบ">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
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

      {deleteUserId && (() => {
        const u = [...teachers, ...students].find((x) => x.id === deleteUserId);
        return u ? (
          <DeleteConfirmModal
            userId={deleteUserId}
            userName={u.full_name}
            onClose={() => setDeleteUserId(null)}
            onDeleted={() => {
              setTeachers((prev) => prev.filter((x) => x.id !== deleteUserId));
              setStudents((prev) => prev.filter((x) => x.id !== deleteUserId));
              setDeleteUserId(null);
            }}
          />
        ) : null;
      })()}

      {bulkDeleteYear && (
        <BulkDeleteModal
          year={bulkDeleteYear}
          role={tab === "teachers" ? "teacher" : "student"}
          count={bulkDeleteCount}
          onClose={() => setBulkDeleteYear(null)}
          onDeleted={() => {
            if (tab === "teachers") {
              setTeachers((prev) => prev.filter((t) => t.academic_year !== bulkDeleteYear));
            } else {
              setStudents((prev) => prev.filter((s) => s.class_year !== bulkDeleteYear));
            }
            setBulkDeleteYear(null);
            setYearFilter("__all__");
            router.refresh();
          }}
        />
      )}

      {bulkDeleteAll && (
        <BulkDeleteModal
          year={null}
          role={tab === "teachers" ? "teacher" : "student"}
          count={tab === "teachers" ? teachers.length : students.length}
          onClose={() => setBulkDeleteAll(false)}
          onDeleted={() => {
            if (tab === "teachers") setTeachers([]);
            else setStudents([]);
            setBulkDeleteAll(false);
            setYearFilter("__all__");
            router.refresh();
          }}
        />
      )}

      {batchResetOpen && (
        <BatchResetModal
          year={yearFilter === "__all__" ? null : yearFilter}
          count={yearFilter === "__all__" ? students.length : filteredStudents.length}
          onClose={() => setBatchResetOpen(false)}
        />
      )}

      {addingTeacher && (
        <AddTeacherModal
          onClose={() => setAddingTeacher(false)}
          onAdded={(t) => { setTeachers((prev) => [...prev, t]); setAddingTeacher(false); }}
        />
      )}

      {addingStudent && (
        <AddStudentModal
          classes={classes}
          onClose={() => setAddingStudent(false)}
          onAdded={(s) => { setStudents((prev) => [...prev, s]); setAddingStudent(false); }}
        />
      )}

      {changeRoleId && (() => {
        const t = teachers.find((x) => x.id === changeRoleId);
        return t ? (
          <ChangeRoleModal
            userId={changeRoleId}
            userName={t.full_name}
            currentRole={t.role}
            onClose={() => setChangeRoleId(null)}
            onChanged={(newRole) => {
              setTeachers((prev) => prev.map((x) => x.id === changeRoleId ? { ...x, role: newRole } : x));
              setChangeRoleId(null);
            }}
          />
        ) : null;
      })()}
    </div>
  );
}
