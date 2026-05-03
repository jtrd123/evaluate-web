"use client";

import { useState } from "react";

interface ClassItem {
  id: string;
  name: string;
  academic_year: string;
  student_count: number;
}

interface Props {
  initialClasses: ClassItem[];
}

export default function ClassManager({ initialClasses }: Props) {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newYear, setNewYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editYear, setEditYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = classes.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.academic_year.includes(search)
  );

  const grouped = new Map<string, ClassItem[]>();
  for (const c of filtered) {
    if (!grouped.has(c.academic_year)) grouped.set(c.academic_year, []);
    grouped.get(c.academic_year)!.push(c);
  }
  const years = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  async function handleAdd() {
    if (!newName.trim() || !newYear.trim()) { setError("ต้องระบุชื่อห้องและปีการศึกษา"); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/admin/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), academic_year: newYear.trim() }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setClasses((prev) => [...prev, { ...data, student_count: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
    setNewName(""); setNewYear(""); setAdding(false);
  }

  async function handleEdit(id: string) {
    setSaving(true); setError(null);
    const res = await fetch(`/api/admin/classes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), academic_year: editYear.trim() }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setClasses((prev) => prev.map((c) => c.id === id ? { ...c, name: data.name, academic_year: data.academic_year } : c));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/classes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setClasses((prev) => prev.filter((c) => c.id !== id));
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white";

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อห้อง..."
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={() => { setAdding(true); setError(null); }}
          className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          เพิ่มห้องเรียน
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="card mb-6 border-2 border-primary/20 bg-primary/2">
          <h3 className="font-bold text-primary mb-4">เพิ่มห้องเรียนใหม่</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-semibold text-base-black/60 mb-1 block">ชื่อห้องเรียน</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="เช่น ม.4/1" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-base-black/60 mb-1 block">ปีการศึกษา</label>
              <input value={newYear} onChange={(e) => setNewYear(e.target.value)} placeholder="เช่น 2567" maxLength={4} className={inputCls} />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <button onClick={() => { setAdding(false); setError(null); }} className="px-5 py-2 rounded-xl border border-gray-200 text-sm text-base-black/60 hover:bg-gray-50">
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Grouped by year */}
      {years.length === 0 ? (
        <div className="card text-center py-12 text-base-black/40 text-sm">ยังไม่มีห้องเรียน</div>
      ) : (
        <div className="space-y-6">
          {years.map((year) => (
            <div key={year}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-bold text-primary">ปีการศึกษา {year}</h2>
                <span className="text-xs text-base-black/40 bg-gray-100 px-2 py-0.5 rounded-full">
                  {grouped.get(year)!.length} ห้อง
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-base-black/40 uppercase">ห้องเรียน</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-base-black/40 uppercase">นักเรียน</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {grouped.get(year)!.sort((a, b) => a.name.localeCompare(b.name)).map((cls) => (
                      <tr key={cls.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-3">
                          {editingId === cls.id ? (
                            <div className="flex gap-2">
                              <input value={editName} onChange={(e) => setEditName(e.target.value)}
                                className="px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-28" />
                              <input value={editYear} onChange={(e) => setEditYear(e.target.value)}
                                className="px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-20" maxLength={4} />
                            </div>
                          ) : (
                            <span className="font-semibold text-primary">{cls.name}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-base-black/50">{cls.student_count} คน</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {editingId === cls.id ? (
                              <>
                                <button onClick={() => handleEdit(cls.id)} disabled={saving}
                                  className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50">
                                  บันทึก
                                </button>
                                <button onClick={() => setEditingId(null)}
                                  className="px-3 py-1 rounded-lg border border-gray-200 text-xs text-base-black/60 hover:bg-gray-50">
                                  ยกเลิก
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setEditingId(cls.id); setEditName(cls.name); setEditYear(cls.academic_year); }}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/8 transition-colors"
                                  title="แก้ไข"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(cls.id)}
                                  disabled={deletingId === cls.id}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                                  title="ลบ"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold text-base-black mb-2">ลบห้องเรียน?</h3>
            <p className="text-sm text-base-black/60 mb-5">
              นักเรียนในห้องนี้จะถูกยกเลิกการผูกห้อง และการจับคู่ที่เกี่ยวข้องอาจได้รับผลกระทบ
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/70 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={() => handleDelete(confirmDeleteId)} disabled={!!deletingId}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {deletingId ? "กำลังลบ..." : "ลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
