"use client";

import { useState, useId } from "react";
import * as XLSX from "xlsx";
import { translateError } from "@/lib/errors";

interface ParsedStudent {
  rowNum: number;
  full_name: string;
  email: string;
  password: string;
  student_number: string;
  class_name: string;
  status: string;
}

interface ImportResult {
  success: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

const COLUMN_MAP: Record<string, string> = {
  "คำนำหน้า": "prefix",
  "ชื่อ": "first_name",
  "นามสกุล": "last_name",
  "Email": "email",
  "email": "email",
  "Password": "password",
  "password": "password",
  "รหัสนักศึกษา": "student_number",
  "รหัสบัตรประชาชน": "national_id",
  "ชั้น/ห้อง": "class_name",
  "ชั้น": "grade",
  "ห้อง": "room",
  "สถานะ": "status",
};

const ACTIVE_STATUSES = ["กำลังศึกษา"];
const CURRENT_THAI_YEAR = (new Date().getFullYear() + 543).toString();

function downloadTemplate() {
  const headers = [
    "ลำดับ", "ชั้น", "ห้อง", "เลขที่", "สถานะ",
    "รหัสบัตรประชาชน", "รหัสนักศึกษา", "เพศ",
    "คำนำหน้า", "ชื่อ", "นามสกุล", "ชื่อเล่น",
    "วัน/เดือน/ปีเกิด", "Email", "Password",
  ];
  const sample = [
    "1", "ม.4", "3", "1", "กำลังศึกษา",
    "1234567890123", "10001", "ชาย",
    "นาย", "สมชาย", "ใจดี", "ชาย",
    "01/01/2550",
    `=IF(G2<>"",G2&"@sukhon.ac.th","")`,
    `=IF(F2<>"","Skdw"&F2,"")`,
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  ws["!cols"] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ข้อมูลนักเรียนทั้งหมด");
  XLSX.writeFile(wb, "student_import_template.xlsx");
}

function getVal(row: Record<string, unknown>, targetKey: string): string {
  const col = Object.keys(row).find((k) => COLUMN_MAP[k] === targetKey);
  if (!col) return "";
  const v = String(row[col] ?? "").trim();
  return v.startsWith("=") ? "" : v;
}

function parseWorkbook(wb: XLSX.WorkBook): { students: ParsedStudent[]; inactive: number } {
  const sheetName =
    wb.SheetNames.find((n) => n === "Template_Import") ??
    wb.SheetNames.find((n) => n.includes("นักเรียน")) ??
    wb.SheetNames[0];

  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
  if (raw.length === 0) throw new Error("ไม่พบข้อมูลในไฟล์");

  let inactive = 0;
  const students: ParsedStudent[] = [];

  raw.forEach((row, idx) => {
    const status = getVal(row, "status");
    if (status && !ACTIVE_STATUSES.includes(status)) { inactive++; return; }

    const prefix     = getVal(row, "prefix");
    const first      = getVal(row, "first_name");
    const last       = getVal(row, "last_name");
    const studentNum = getVal(row, "student_number");
    const nationalId = getVal(row, "national_id");
    const grade      = getVal(row, "grade");
    const room       = getVal(row, "room");
    const className  = getVal(row, "class_name") || (grade && room ? `${grade}/${room}` : grade || room);

    let email = getVal(row, "email");
    if (!email && studentNum) email = `${studentNum}@sukhon.ac.th`;
    else if (email) email = email.replace(/^0+(\d+@)/, "$1");

    let password = getVal(row, "password");
    if (!password && nationalId) password = `Skdw${nationalId}`;

    const full_name = [prefix, first, last].filter(Boolean).join(" ");
    if (!email || !full_name) return;

    students.push({ rowNum: idx + 2, full_name, email: email.toLowerCase(), password, student_number: studentNum, class_name: className, status: status || "กำลังศึกษา" });
  });

  return { students, inactive };
}

function downloadCredentials(students: ParsedStudent[]) {
  const headers = ["ชื่อ-นามสกุล", "ชั้น/ห้อง", "Username (Email)", "รหัสผ่าน"];
  const data = students.map((s) => [s.full_name, s.class_name || "—", s.email, s.password || "password123"]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 30 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ข้อมูล Login");
  XLSX.writeFile(wb, "student_credentials.xlsx");
}

type Step = 1 | 2 | 3;

export default function StudentImportWizard() {
  const fileInputId = useId();

  const [step, setStep]               = useState<Step>(1);
  const [academicYear, setAcademicYear] = useState(CURRENT_THAI_YEAR);
  const [mode, setMode]               = useState<"all" | "new_only">("all");
  const [fileName, setFileName]       = useState("");
  const [parseError, setParseError]   = useState<string | null>(null);
  const [rows, setRows]               = useState<ParsedStudent[]>([]);
  const [skippedInactive, setSkippedInactive] = useState(0);
  const [importing, setImporting]     = useState(false);
  const [result, setResult]           = useState<ImportResult | null>(null);
  const [importedRows, setImportedRows] = useState<ParsedStudent[]>([]);

  function handleFile(file: File) {
    setParseError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const { students, inactive } = parseWorkbook(XLSX.read(data, { type: "array" }));
        setRows(students);
        setSkippedInactive(inactive);
        if (students.length === 0) { setParseError("ไม่พบนักเรียนที่มีสถานะ 'กำลังศึกษา' ในไฟล์"); return; }
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
      const batch = rows.slice(i, i + BATCH).map((s) => ({
        full_name: s.full_name, email: s.email, password: s.password,
        student_number: s.student_number, class_name: s.class_name,
      }));
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "students", rows: batch, skipExisting: mode === "new_only", academicYear }),
      });
      if (!res.ok) { combined.errors.push({ row: i + 1, message: "batch error: " + (await res.text()) }); continue; }
      const data: ImportResult = await res.json();
      combined.success += data.success;
      combined.skipped += data.skipped;
      combined.errors.push(...data.errors.map((e) => ({ ...e, row: e.row + i })));
    }

    setResult(combined);
    setImportedRows(rows);
    setImporting(false);
    setStep(3);
  }

  function reset() {
    setStep(1); setRows([]); setFileName(""); setResult(null); setImportedRows([]);
    setParseError(null); setSkippedInactive(0); setAcademicYear(CURRENT_THAI_YEAR);
  }

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="space-y-6">
        {/* Academic year picker */}
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3">
          <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
          </svg>
          <label className="text-sm font-bold text-primary shrink-0">ปีการศึกษา</label>
          <input type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="เช่น 2568"
            className="flex-1 max-w-[120px] px-3 py-1.5 rounded-xl border border-primary/30 text-sm font-mono font-bold text-primary bg-white focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <span className="text-xs text-primary/60">นักเรียนที่ import จะถูกจัดกลุ่มตามปีนี้</span>
        </div>

        {/* Mode */}
        <div className="grid grid-cols-2 gap-4">
          {([
            { id: "all" as const,      icon: "📥", title: "Import ทั้งหมด",   desc: "นำเข้านักเรียนทุกคนในไฟล์" },
            { id: "new_only" as const, icon: "➕", title: "เพิ่มรายชื่อใหม่", desc: "ข้าม Email ที่มีบัญชีอยู่แล้ว" },
          ] as const).map((opt) => (
            <button key={opt.id} onClick={() => setMode(opt.id)}
              className={`text-left p-4 rounded-2xl border-2 transition-all ${mode === opt.id ? "border-primary bg-primary/4" : "border-gray-200 hover:border-gray-300"}`}>
              <div className="text-2xl mb-2">{opt.icon}</div>
              <p className="font-bold text-sm text-base-black">{opt.title}</p>
              <p className="text-xs text-base-black/50 mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* Upload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-base-black/50">ใช้ไฟล์ Excel format เดิมของโรงเรียน</p>
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
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/2 transition-all">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="font-semibold text-base-black mb-1">อัปโหลดไฟล์ Excel (.xlsx)</p>
            <p className="text-sm text-base-black/40">ลากมาวาง หรือคลิกเพื่อเลือกไฟล์</p>
            <p className="text-xs text-base-black/30 mt-2">รองรับ sheet "ข้อมูลนักเรียนทั้งหมด" และ "Template_Import"</p>
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
              ["รหัสนักศึกษา", "Username → รหัส@sukhon.ac.th"],
              ["รหัสบัตรประชาชน", "Password → Skdw + เลขบัตร"],
              ["ชั้น + ห้อง", "รวมเป็น ม.4/3"],
              ["สถานะ", "กรอง เฉพาะ 'กำลังศึกษา'"],
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
    const classCount   = new Set(rows.map((r) => r.class_name).filter(Boolean)).size;
    const missingClass = rows.filter((r) => !r.class_name).length;

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "นักเรียนที่จะ import", value: rows.length, color: "text-primary" },
            { label: "ห้องเรียน", value: classCount, color: "text-green-600" },
            { label: "ข้ามสถานะอื่น", value: skippedInactive, color: "text-amber-600" },
            { label: "ไม่มีห้อง", value: missingClass, color: missingClass > 0 ? "text-red-500" : "text-gray-400" },
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
            ? "โหมด: เพิ่มรายชื่อใหม่ — Email ที่มีบัญชีอยู่แล้วจะถูกข้ามอัตโนมัติ"
            : "โหมด: Import ทั้งหมด — ถ้ามี Email ซ้ำจะแสดงเป็น error"}
        </div>

        <div className="overflow-auto rounded-2xl border border-gray-200 max-h-80">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {["#", "ชื่อเต็ม", "Username", "รหัสนักศึกษา", "ห้อง", "รหัสผ่าน"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-base-black/60 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.slice(0, 200).map((r, i) => (
                <tr key={i} className="hover:bg-gray-50/80">
                  <td className="px-3 py-1.5 text-base-black/30 font-mono">{r.rowNum}</td>
                  <td className="px-3 py-1.5 text-base-black font-medium">{r.full_name}</td>
                  <td className="px-3 py-1.5 text-base-black/70 font-mono">{r.email}</td>
                  <td className="px-3 py-1.5 text-base-black/60 font-mono">{r.student_number || "—"}</td>
                  <td className="px-3 py-1.5 text-base-black/70">{r.class_name || <span className="text-amber-500">ไม่ระบุ</span>}</td>
                  <td className="px-3 py-1.5 text-base-black/40 font-mono">{r.password ? "•••••••" : <span className="text-amber-500">default</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 200 && (
            <div className="px-3 py-2 text-xs text-base-black/40 text-center border-t">แสดง 200 จาก {rows.length} รายการ</div>
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
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />กำลัง import {rows.length} รายการ...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>ยืนยัน import {rows.length} รายการ</>
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
            <p className="font-bold text-base-black">{hasErrors ? "Import เสร็จแล้ว (มีบางรายการผิดพลาด)" : "Import สำเร็จทั้งหมด! 🎉"}</p>
            <p className="text-sm text-base-black/60">จากไฟล์: {fileName}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "สร้างบัญชีสำเร็จ", value: result.success, color: "text-green-600" },
            { label: "ข้ามที่มีอยู่แล้ว", value: result.skipped, color: "text-blue-500" },
            { label: "ผิดพลาด", value: result.errors.length, color: result.errors.length > 0 ? "text-red-500" : "text-gray-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white/70 rounded-xl p-3 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-base-black/50">{s.label}</div>
            </div>
          ))}
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

      {result.success > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-blue-800">ข้อมูล Login ของนักเรียน</p>
          <p className="text-xs text-blue-700">
            Username: รหัสนักศึกษา@sukhon.ac.th &nbsp;·&nbsp; รหัสผ่าน: Skdw + เลขบัตรประชาชน
          </p>
          <button onClick={() => downloadCredentials(importedRows)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors">
            ดาวน์โหลดข้อมูล Login นักเรียน (Excel)
          </button>
        </div>
      )}

      <button onClick={reset}
        className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50 transition-all">
        Import ไฟล์ใหม่
      </button>
    </div>
  );
}
