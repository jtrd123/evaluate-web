"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ImportRow, ImportResult } from "@/app/api/admin/import/route";

type ImportType = "students" | "teachers" | "classes";

const TEMPLATES: Record<ImportType, { headers: string[]; example: string[][] }> = {
  students: {
    headers: ["full_name", "email", "student_number", "class_name", "academic_year"],
    example: [
      ["ด.ช. ใจดี ตั้งใจเรียน", "student2@school.ac.th", "S66002", "ม.4/1", "2567"],
      ["ด.ญ. สมใจ รักเรียน",    "student3@school.ac.th", "S66003", "ม.4/1", "2567"],
    ],
  },
  teachers: {
    headers: ["full_name", "email", "employee_id", "subject"],
    example: [
      ["ครูสมศักดิ์ ใจดี",  "teacher2@school.ac.th", "T002", "คณิตศาสตร์"],
      ["ครูวิมล สุขใจ",    "teacher3@school.ac.th", "T003", "ภาษาไทย"],
    ],
  },
  classes: {
    headers: ["name", "academic_year"],
    example: [
      ["ม.4/1", "2567"],
      ["ม.4/2", "2567"],
      ["ม.5/1", "2567"],
    ],
  },
};

const TYPE_LABEL: Record<ImportType, string> = {
  students: "นักเรียน",
  teachers: "ครู",
  classes:  "ชั้นเรียน",
};

function downloadTemplate(type: ImportType) {
  const t = TEMPLATES[type];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([t.headers, ...t.example]);
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, `import_${type}_template.xlsx`);
}

export default function ImportWizard({ defaultType = "students" }: { defaultType?: ImportType }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [importType, setImportType] = useState<ImportType>(defaultType);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setParseError(null);
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res: Papa.ParseResult<Record<string, string>>) => {
          if (res.errors.length) {
            setParseError("CSV มีข้อผิดพลาด: " + res.errors[0].message);
            return;
          }
          setRows(res.data as unknown as ImportRow[]);
          setStep(2);
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<ImportRow>(ws, { defval: "" });
        setRows(data);
        setStep(2);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setParseError("รองรับเฉพาะไฟล์ .csv, .xlsx, .xls เท่านั้น");
    }
  }

  async function handleImport() {
    setImporting(true);
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: importType, rows }),
      });
      const data: ImportResult = await res.json();
      setResult(data);
      setStep(3);
    } catch {
      setParseError("เกิดข้อผิดพลาดในการส่งข้อมูล");
    }
    setImporting(false);
  }

  function reset() {
    setStep(1);
    setRows([]);
    setFileName("");
    setParseError(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const headers = TEMPLATES[importType].headers;

  return (
    <div className="max-w-4xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= s ? "bg-primary text-base-white" : "bg-gray-100 text-gray-400"
            }`}>{s}</div>
            {s < 3 && <div className={`h-0.5 w-12 ${step > s ? "bg-primary" : "bg-gray-100"}`} />}
          </div>
        ))}
        <span className="ml-2 text-sm text-base-black/50">
          {step === 1 ? "เลือกประเภทและอัปโหลดไฟล์" : step === 2 ? "ตรวจสอบข้อมูล" : "ผลการนำเข้า"}
        </span>
      </div>

      {/* Step 1: Select type + upload */}
      {step === 1 && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Type selector */}
          <div className="card">
            <h3 className="font-bold text-primary mb-4">เลือกประเภทข้อมูลที่ต้องการนำเข้า</h3>
            <div className="grid grid-cols-3 gap-3">
              {(["students", "teachers", "classes"] as ImportType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setImportType(t)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    importType === t
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-base-black/60 hover:border-primary/30"
                  }`}
                >
                  <span className="text-2xl">
                    {t === "students" ? "👨‍🎓" : t === "teachers" ? "👩‍🏫" : "🏫"}
                  </span>
                  <span className="font-semibold text-sm">{TYPE_LABEL[t]}</span>
                  <span className="text-xs text-base-black/40 text-center leading-relaxed">
                    {TEMPLATES[t].headers.join(", ")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Template download */}
          <div className="card flex items-center justify-between gap-4 bg-primary/3 border-primary/10">
            <div>
              <p className="font-semibold text-primary text-sm">ดาวน์โหลด Template</p>
              <p className="text-xs text-base-black/50 mt-0.5">
                ไฟล์ Excel พร้อมหัวคอลัมน์และตัวอย่างข้อมูลสำหรับ{TYPE_LABEL[importType]}
              </p>
            </div>
            <button
              onClick={() => downloadTemplate(importType)}
              className="flex items-center gap-2 bg-primary text-base-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              ดาวน์โหลด Template
            </button>
          </div>

          {/* File upload */}
          <div className="card">
            <h3 className="font-bold text-primary mb-4">อัปโหลดไฟล์</h3>
            <div
              className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-primary/40 hover:bg-primary/2 transition-all cursor-pointer"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
            >
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="font-semibold text-base-black/60">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
              <p className="text-xs text-base-black/30 mt-1">รองรับ .csv, .xlsx, .xls</p>
              {fileName && <p className="mt-2 text-sm text-primary font-medium">{fileName}</p>}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {parseError && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{parseError}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-primary">ตรวจสอบข้อมูลก่อนนำเข้า</h3>
                <p className="text-sm text-base-black/50 mt-0.5">
                  พบ <strong className="text-primary">{rows.length}</strong> รายการ — นำเข้าประเภท: {TYPE_LABEL[importType]}
                </p>
              </div>
              <button onClick={reset} className="text-sm text-base-black/50 hover:text-primary transition-colors">
                ← เลือกไฟล์ใหม่
              </button>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-gray-100">
              <table className="w-full text-xs min-w-max">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-base-black/50 font-semibold">#</th>
                    {headers.map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-base-black/50 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.slice(0, 100).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/80">
                      <td className="px-3 py-2 text-base-black/30 font-mono">{i + 1}</td>
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2 text-base-black">
                          {String((row as unknown as Record<string, unknown>)[h] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 100 && (
                <div className="px-3 py-2 text-xs text-base-black/40 text-center border-t">
                  แสดง 100 จาก {rows.length} รายการ
                </div>
              )}
            </div>

            {parseError && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{parseError}</p>
            )}
          </div>

          {importType !== "classes" && (
            <div className="card bg-amber-50 border border-amber-200">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-amber-800">บัญชีที่สร้างจะใช้รหัสผ่านเริ่มต้น: <code className="bg-amber-100 px-1.5 py-0.5 rounded">password123</code></p>
                  <p className="text-xs text-amber-700 mt-0.5">แนะนำให้แจ้งให้{TYPE_LABEL[importType]}เปลี่ยนรหัสผ่านเมื่อ login ครั้งแรก</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50">
              ยกเลิก
            </button>
            <button
              onClick={handleImport}
              disabled={importing || rows.length === 0}
              className="flex-1 py-3 rounded-xl bg-accent text-primary font-bold text-sm hover:bg-accent/90 disabled:opacity-50 transition-all"
            >
              {importing ? `กำลังนำเข้า ${rows.length} รายการ...` : `ยืนยันนำเข้า ${rows.length} รายการ`}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && result && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card bg-green-50 border border-green-200 text-center">
              <div className="text-4xl font-black text-green-600 mb-1">{result.success}</div>
              <div className="text-sm text-green-700 font-semibold">นำเข้าสำเร็จ</div>
            </div>
            <div className="card bg-red-50 border border-red-200 text-center">
              <div className="text-4xl font-black text-red-500 mb-1">{result.errors.length}</div>
              <div className="text-sm text-red-600 font-semibold">มีข้อผิดพลาด</div>
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="card border border-red-200">
              <h3 className="font-bold text-red-600 mb-3">รายการที่มีข้อผิดพลาด</h3>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm bg-red-50 rounded-xl px-3 py-2">
                    <span className="font-mono text-red-400 shrink-0">แถว {e.row}</span>
                    <span className="text-red-700">{e.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.success > 0 && (
            <div className="card bg-green-50 border border-green-200">
              <p className="text-sm text-green-700 font-semibold">
                ✅ นำเข้า{TYPE_LABEL[importType]}{result.success} รายการสำเร็จ
                {importType !== "classes" && " — บัญชีพร้อมใช้งานด้วยรหัสผ่าน password123"}
              </p>
            </div>
          )}

          <button
            onClick={reset}
            className="w-full py-3 rounded-xl bg-primary text-base-white font-bold text-sm hover:bg-primary/90 transition-all"
          >
            นำเข้าข้อมูลอีกชุด
          </button>
        </div>
      )}
    </div>
  );
}
