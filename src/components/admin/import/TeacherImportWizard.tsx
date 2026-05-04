"use client";

import { useState, useId } from "react";
import * as XLSX from "xlsx";
import { translateError } from "@/lib/errors";

interface ParsedTeacher {
  rowNum: number;
  full_name: string;
  email: string;            // stored as {employee_id}@sukhon.ac.th
  password: string;         // Skdw{national_id}
  employee_id: string;
  teaching_levels: string;  // "ม.2, ม.3, ม.4"
  subject: string;          // กลุ่มสาระที่สอน
}

interface ImportResult {
  success: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

// Header → internal key
const COLUMN_MAP: Record<string, string> = {
  "คำนำหน้า":          "prefix",
  "ชื่อ":              "first_name",
  "นามสกุล":           "last_name",
  "รหัสบัตรประชาชน":   "national_id",
  "รหัสครูผู้สอน":     "employee_id",
  "Username":          "username",
  "username":          "username",
  "Password":          "password",
  "password":          "password",
  "ชั้นที่สอน":        "teaching_levels",
  "กลุ่มสาระที่สอน":   "subject",
};

type Step = 1 | 2 | 3;

// รหัสบัตรประชาชนใน Excel มักแสดงเป็น scientific notation → แปลงกลับเป็น string
function toIdString(val: unknown): string {
  if (!val) return "";
  const s = String(val).trim();
  // Scientific notation เช่น 1.21221E+12
  if (/e\+/i.test(s)) {
    const n = Number(s);
    return isNaN(n) ? s : Math.round(n).toString();
  }
  // Float เช่น 1212212112121.0
  if (s.includes(".")) {
    const n = Number(s);
    return isNaN(n) ? s : Math.round(n).toString();
  }
  return s;
}

function getVal(row: Record<string, unknown>, targetKey: string): string {
  const col = Object.keys(row).find((k) => COLUMN_MAP[k] === targetKey);
  if (!col) return "";
  if (targetKey === "national_id") return toIdString(row[col]);
  const v = String(row[col] ?? "").trim();
  return v.startsWith("=") ? "" : v;
}

function downloadTemplate() {
  const headers = ["ลำดับ", "รหัสบัตรประชาชน", "คำนำหน้า", "ชื่อ", "นามสกุล", "รหัสครูผู้สอน", "Username", "Password", "ชั้นที่สอน", "กลุ่มสาระที่สอน"];
  const sample  = ["1", "1212212112121", "นาย", "อ่อนโยน", "ใจดี", "T0001", "T0001", "Skdw1212212112121", "ม.2, ม.3", "วิทยาศาสตร์และเทคโนโลยี"];
  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  ws["!cols"] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template_Teacher");
  XLSX.writeFile(wb, "teacher_import_template.xlsx");
}

function parseWorkbook(wb: XLSX.WorkBook): ParsedTeacher[] {
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase().includes("teacher") || n.includes("ครู")) ??
    wb.SheetNames[0];

  const ws  = wb.Sheets[sheetName];
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
  if (raw.length === 0) throw new Error("ไม่พบข้อมูลในไฟล์");

  const teachers: ParsedTeacher[] = [];

  raw.forEach((row, idx) => {
    const prefix     = getVal(row, "prefix");
    const first      = getVal(row, "first_name");
    const last       = getVal(row, "last_name");
    const nationalId = getVal(row, "national_id");
    const employeeId = getVal(row, "employee_id") || getVal(row, "username");

    if (!first && !last) return; // skip empty rows

    // Username stored as employee_id@sukhon.ac.th
    const email          = employeeId ? `${employeeId}@sukhon.ac.th` : "";
    const password       = nationalId ? `Skdw${nationalId}` : (getVal(row, "password") || "");
    const teachingLevels = getVal(row, "teaching_levels");
    const subject        = getVal(row, "subject");

    const full_name = [prefix, first, last].filter(Boolean).join(" ");
    if (!email || !full_name) return;

    teachers.push({
      rowNum: idx + 2,
      full_name,
      email,
      password,
      employee_id:     employeeId,
      teaching_levels: teachingLevels,
      subject,
    });
  });

  return teachers;
}

export default function TeacherImportWizard() {
  const fileInputId = useId();

  const [step, setStep]           = useState<Step>(1);
  const [mode, setMode]           = useState<"all" | "new_only">("all");
  const [fileName, setFileName]   = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [rows, setRows]           = useState<ParsedTeacher[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState<ImportResult | null>(null);

  function handleFile(file: File) {
    setParseError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb   = XLSX.read(data, { type: "array" });
        const teachers = parseWorkbook(wb);
        setRows(teachers);
        if (teachers.length === 0) {
          setParseError("ไม่พบข้อมูลครูในไฟล์ กรุณาตรวจสอบ column headers");
          return;
        }
        setStep(2);
      } catch (err) {
        setParseError((err as Error).message || "อ่านไฟล์ไม่สำเร็จ");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    setImporting(true);
    setResult(null);

    const BATCH = 50;
    const combined: ImportResult = { success: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH).map((t) => ({
        full_name:       t.full_name,
        email:           t.email,
        password:        t.password,
        employee_id:     t.employee_id,
        teaching_levels: t.teaching_levels,
        subject:         t.subject,
      }));

      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "teachers", rows: batch, skipExisting: mode === "new_only" }),
      });

      if (!res.ok) {
        combined.errors.push({ row: i + 1, message: "batch error: " + (await res.text()) });
        continue;
      }
      const data: ImportResult = await res.json();
      combined.success += data.success;
      combined.skipped += data.skipped;
      combined.errors.push(...data.errors.map((e) => ({ ...e, row: e.row + i })));
    }

    setResult(combined);
    setImporting(false);
    setStep(3);
  }

  function reset() {
    setStep(1); setRows([]); setFileName(""); setResult(null); setParseError(null);
  }

  // ── Step 1 ────────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="space-y-6">
        {/* Mode */}
        <div className="grid grid-cols-2 gap-4">
          {([
            { id: "all" as const,      icon: "📥", title: "Import ทั้งหมด",   desc: "นำเข้าครูทุกคนในไฟล์" },
            { id: "new_only" as const, icon: "➕", title: "เพิ่มรายชื่อใหม่", desc: "ข้าม Username ที่มีบัญชีอยู่แล้ว" },
          ] as const).map((opt) => (
            <button key={opt.id} onClick={() => setMode(opt.id)}
              className={`text-left p-4 rounded-2xl border-2 transition-all ${
                mode === opt.id ? "border-primary bg-primary/4" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-2xl mb-2">{opt.icon}</div>
              <p className="font-bold text-sm text-base-black">{opt.title}</p>
              <p className="text-xs text-base-black/50 mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* Upload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-base-black/50">ใช้ไฟล์ Excel format Template_Teacher</p>
            <button type="button" onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              ดาวน์โหลด Template
            </button>
          </div>

          <label htmlFor={fileInputId}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/2 transition-all"
          >
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="font-semibold text-base-black mb-1">อัปโหลดไฟล์ Excel (.xlsx)</p>
            <p className="text-sm text-base-black/40">ลากมาวาง หรือคลิกเพื่อเลือกไฟล์</p>
            <p className="text-xs text-base-black/30 mt-2">รองรับ sheet "Template_Teacher"</p>
          </label>

          <input id={fileInputId} type="file" accept=".xlsx,.xls" className="sr-only"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

          {parseError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {parseError}
            </div>
          )}
        </div>

        {/* Column reference */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-base-black/60 mb-3">คอลัมน์ที่ระบบใช้จาก Excel</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {[
              ["คำนำหน้า + ชื่อ + นามสกุล", "ชื่อเต็ม"],
              ["รหัสครูผู้สอน / Username", "Username → รหัส@sukhon.ac.th"],
              ["รหัสบัตรประชาชน", "Password → Skdw + เลขบัตร"],
              ["ชั้นที่สอน", "เช่น ม.2, ม.3, ม.4 (คั่นด้วย , )"],
              ["กลุ่มสาระที่สอน", "เช่น วิทยาศาสตร์และเทคโนโลยี"],
            ].map(([col, desc]) => (
              <div key={col} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-primary bg-primary/8 px-1.5 py-0.5 rounded">{col}</span>
                <span className="text-base-black/50">→ {desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Preview ──────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "ครูที่จะ import", value: rows.length, color: "text-primary" },
            { label: "มีชั้นที่สอน", value: rows.filter((r) => r.teaching_levels).length, color: "text-green-600" },
            { label: "ขาด Username", value: rows.filter((r) => !r.employee_id).length, color: "text-red-600" },
            { label: "ขาด Password", value: rows.filter((r) => !r.password).length, color: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-2xl p-3 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-base-black/50 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold ${
          mode === "new_only" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-blue-50 border-blue-200 text-blue-700"
        }`}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          {mode === "new_only"
            ? "โหมด: เพิ่มรายชื่อใหม่ — Username ที่มีบัญชีอยู่แล้วจะถูกข้ามอัตโนมัติ"
            : "โหมด: Import ทั้งหมด — ถ้ามี Username ซ้ำจะแสดงเป็น error"}
        </div>

        <div className="overflow-auto rounded-2xl border border-gray-200 max-h-96">
          {(() => {
            const capped = rows.slice(0, 200);
            const grouped = new Map<string, typeof capped>();
            for (const r of capped) {
              const key = r.subject?.trim() || "ไม่ระบุกลุ่มสาระ";
              if (!grouped.has(key)) grouped.set(key, []);
              grouped.get(key)!.push(r);
            }
            const sortedKeys = Array.from(grouped.keys()).sort((a, b) =>
              a === "ไม่ระบุกลุ่มสาระ" ? 1 : b === "ไม่ระบุกลุ่มสาระ" ? -1 : a.localeCompare(b, "th")
            );
            return (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {["#", "ชื่อเต็ม", "Username", "รหัสครู", "ชั้นที่สอน", "รหัสผ่าน"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-base-black/60 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedKeys.map((subject) => (
                    <>
                      <tr key={`hdr-${subject}`} className="bg-primary/5">
                        <td colSpan={6} className="px-3 py-1.5 font-bold text-primary text-[11px] uppercase tracking-wide">
                          {subject} ({grouped.get(subject)!.length} คน)
                        </td>
                      </tr>
                      {grouped.get(subject)!.map((r, i) => (
                        <tr key={`${subject}-${i}`} className="hover:bg-gray-50/80 border-t border-gray-50">
                          <td className="px-3 py-1.5 text-base-black/30 font-mono">{r.rowNum}</td>
                          <td className="px-3 py-1.5 text-base-black font-medium">{r.full_name}</td>
                          <td className="px-3 py-1.5 text-base-black/70 font-mono">{r.email.replace("@sukhon.ac.th", "")}</td>
                          <td className="px-3 py-1.5 text-base-black/60 font-mono">{r.employee_id || <span className="text-red-400">ไม่มี</span>}</td>
                          <td className="px-3 py-1.5 text-base-black/70">{r.teaching_levels || <span className="text-base-black/25">—</span>}</td>
                          <td className="px-3 py-1.5 text-base-black/40 font-mono">{r.password ? "•••••••" : <span className="text-amber-500">ไม่มี</span>}</td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            );
          })()}
          {rows.length > 200 && (
            <div className="px-3 py-2 text-xs text-base-black/40 text-center border-t">
              แสดง 200 จาก {rows.length} รายการ
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={reset}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50">
            ← ย้อนกลับ
          </button>
          <button onClick={handleImport} disabled={importing || rows.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all">
            {importing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                กำลัง import {rows.length} รายการ...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                ยืนยัน import {rows.length} รายการ
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Result ────────────────────────────────────────────────────────
  if (!result) return null;
  const hasErrors = result.errors.length > 0;

  return (
    <div className="space-y-5">
      <div className={`rounded-2xl p-5 ${hasErrors ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`}>
        <div className="flex items-center gap-3 mb-4">
          {hasErrors ? (
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <div>
            <p className="font-bold text-base-black">
              {hasErrors ? "Import เสร็จแล้ว (มีบางรายการผิดพลาด)" : "Import สำเร็จทั้งหมด! 🎉"}
            </p>
            <p className="text-sm text-base-black/60">จากไฟล์: {fileName}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-green-600">{result.success}</div>
            <div className="text-xs text-base-black/50">สร้างบัญชีสำเร็จ</div>
          </div>
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-blue-500">{result.skipped}</div>
            <div className="text-xs text-base-black/50">ข้ามที่มีอยู่แล้ว</div>
          </div>
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <div className={`text-2xl font-black ${result.errors.length > 0 ? "text-red-500" : "text-gray-400"}`}>
              {result.errors.length}
            </div>
            <div className="text-xs text-base-black/50">ผิดพลาด</div>
          </div>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="bg-red-50 rounded-2xl border border-red-200 p-4">
          <p className="text-sm font-bold text-red-700 mb-3">รายการที่ผิดพลาด ({result.errors.length} รายการ)</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {result.errors.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                <span className="font-mono shrink-0">แถว {e.row}:</span>
                <span>{translateError(e.message)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={reset}
        className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50 transition-all">
        Import ไฟล์ใหม่
      </button>
    </div>
  );
}
