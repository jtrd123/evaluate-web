(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/src_0817a2._.js", {

"[project]/src/components/admin/import/StudentImportWizard.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, k: __turbopack_refresh__, m: module, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "default": (()=>StudentImportWizard)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/xlsx/xlsx.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_refresh__.signature();
"use client";
;
;
const EMPTY_MANUAL = {
    prefix: "นาย",
    first_name: "",
    last_name: "",
    student_number: "",
    national_id: "",
    class_name: ""
};
// Header → internal key mapping (matches actual school Excel)
const COLUMN_MAP = {
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
    "สถานะ": "status"
};
const ACTIVE_STATUSES = [
    "กำลังศึกษา"
];
// ─── Template download — matches school's actual format ──────────────────────
function downloadTemplate() {
    const headers = [
        "ลำดับ",
        "ชั้น/ห้อง",
        "เลขที่",
        "สถานะ",
        "รหัสบัตรประชาชน",
        "รหัสนักศึกษา",
        "เพศ",
        "คำนำหน้า",
        "ชื่อ",
        "นามสกุล",
        "ชื่อเล่น",
        "วัน/เดือน/ปีเกิด",
        "Email",
        "Password"
    ];
    const sample = [
        "1",
        "ม.1/1",
        "1",
        "กำลังศึกษา",
        "1234567890123",
        "10001",
        "ชาย",
        "นาย",
        "สมชาย",
        "ใจดี",
        "ชาย",
        "01/01/2550",
        `=IF(F2<>"","0"&F2&"@sukhon.ac.th","")`,
        `=IF(E2<>"","Skdw"&E2,"")`
    ];
    const ws = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__.utils.aoa_to_sheet([
        headers,
        sample
    ]);
    ws["!cols"] = headers.map(()=>({
            wch: 20
        }));
    const wb = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__.utils.book_new();
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__.utils.book_append_sheet(wb, ws, "ข้อมูลนักเรียนทั้งหมด");
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__.writeFile(wb, "student_import_template.xlsx");
}
// ─── Helper: get cell value by mapped key ────────────────────────────────────
function getVal(row, targetKey) {
    const col = Object.keys(row).find((k)=>COLUMN_MAP[k] === targetKey);
    if (!col) return "";
    const v = String(row[col] ?? "").trim();
    // If the cell still holds a formula string, treat as empty
    return v.startsWith("=") ? "" : v;
}
// ─── Excel parser ────────────────────────────────────────────────────────────
function parseWorkbook(wb) {
    // Prefer Template_Import (has pre-computed email/password values) then ข้อมูลนักเรียนทั้งหมด
    const sheetName = wb.SheetNames.find((n)=>n === "Template_Import") ?? wb.SheetNames.find((n)=>n.includes("นักเรียน")) ?? wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    // raw=true would give cells, defval="" gives empty string for blanks
    const raw = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__.utils.sheet_to_json(ws, {
        defval: ""
    });
    if (raw.length === 0) throw new Error("ไม่พบข้อมูลในไฟล์");
    let inactive = 0;
    const students = [];
    raw.forEach((row, idx)=>{
        const status = getVal(row, "status");
        if (status && !ACTIVE_STATUSES.includes(status)) {
            inactive++;
            return;
        }
        const prefix = getVal(row, "prefix");
        const first = getVal(row, "first_name");
        const last = getVal(row, "last_name");
        const studentNum = getVal(row, "student_number");
        const nationalId = getVal(row, "national_id");
        const className = getVal(row, "class_name");
        // Email: read from column, or derive as 0{studentNum}@sukhon.ac.th
        let email = getVal(row, "email");
        if (!email && studentNum) email = `0${studentNum}@sukhon.ac.th`;
        // Password: read from column, or derive as Skdw{nationalId}
        let password = getVal(row, "password");
        if (!password && nationalId) password = `Skdw${nationalId}`;
        const full_name = [
            prefix,
            first,
            last
        ].filter(Boolean).join(" ");
        if (!email || !full_name) return;
        students.push({
            rowNum: idx + 2,
            full_name,
            email: email.toLowerCase(),
            password,
            student_number: studentNum,
            class_name: className,
            status: status || "กำลังศึกษา"
        });
    });
    return {
        students,
        inactive
    };
}
function StudentImportWizard() {
    _s();
    const fileInputId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    const [step, setStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("all");
    const [inputTab, setInputTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("file");
    const [fileName, setFileName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [parseError, setParseError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [rows, setRows] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [skippedInactive, setSkippedInactive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [importing, setImporting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [manual, setManual] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(EMPTY_MANUAL);
    const [manualError, setManualError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    function handleFile(file) {
        setParseError(null);
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e)=>{
            try {
                const data = new Uint8Array(e.target.result);
                const wb = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__.read(data, {
                    type: "array"
                });
                const { students, inactive } = parseWorkbook(wb);
                setRows(students);
                setSkippedInactive(inactive);
                if (students.length === 0) {
                    setParseError("ไม่พบนักเรียนที่มีสถานะ 'กำลังศึกษา' ในไฟล์");
                    return;
                }
                setStep(2);
            } catch (err) {
                setParseError(err.message || "อ่านไฟล์ไม่สำเร็จ");
            }
        };
        reader.readAsArrayBuffer(file);
    }
    function handleManualSubmit(e) {
        e.preventDefault();
        setManualError(null);
        if (!manual.first_name.trim() || !manual.last_name.trim()) {
            setManualError("กรุณากรอกชื่อและนามสกุล");
            return;
        }
        if (!manual.student_number.trim()) {
            setManualError("กรุณากรอกรหัสนักศึกษา");
            return;
        }
        if (!manual.national_id.trim()) {
            setManualError("กรุณากรอกรหัสบัตรประชาชน");
            return;
        }
        const email = `0${manual.student_number.trim()}@sukhon.ac.th`;
        const password = `Skdw${manual.national_id.trim()}`;
        const full_name = [
            manual.prefix,
            manual.first_name.trim(),
            manual.last_name.trim()
        ].filter(Boolean).join(" ");
        setRows([
            {
                rowNum: 1,
                full_name,
                email,
                password,
                student_number: manual.student_number.trim(),
                class_name: manual.class_name.trim(),
                status: "กำลังศึกษา"
            }
        ]);
        setSkippedInactive(0);
        setFileName("กรอกแบบฟอร์ม");
        setStep(2);
    }
    async function handleImport() {
        setImporting(true);
        setResult(null);
        const BATCH = 50;
        const combined = {
            success: 0,
            skipped: 0,
            errors: []
        };
        for(let i = 0; i < rows.length; i += BATCH){
            const batch = rows.slice(i, i + BATCH).map((s)=>({
                    full_name: s.full_name,
                    email: s.email,
                    password: s.password,
                    student_number: s.student_number,
                    class_name: s.class_name
                }));
            const res = await fetch("/api/admin/import", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    type: "students",
                    rows: batch,
                    skipExisting: mode === "new_only"
                })
            });
            if (!res.ok) {
                combined.errors.push({
                    row: i + 1,
                    message: "batch error: " + await res.text()
                });
                continue;
            }
            const data = await res.json();
            combined.success += data.success;
            combined.skipped += data.skipped;
            combined.errors.push(...data.errors.map((err)=>({
                    ...err,
                    row: err.row + i
                })));
        }
        setResult(combined);
        setImporting(false);
        setStep(3);
    }
    function resetToStep1() {
        setStep(1);
        setRows([]);
        setFileName("");
        setResult(null);
        setManual(EMPTY_MANUAL);
        setManualError(null);
        setParseError(null);
    }
    // ── Step 1 ──────────────────────────────────────────────────────────────────
    if (step === 1) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-2 gap-4",
                    children: [
                        {
                            id: "all",
                            icon: "📥",
                            title: "Import ทั้งหมด",
                            desc: "นำเข้านักเรียนทุกคนในไฟล์ (เริ่มต้นภาคเรียนใหม่)"
                        },
                        {
                            id: "new_only",
                            icon: "➕",
                            title: "เพิ่มรายชื่อใหม่",
                            desc: "ข้ามอีเมลที่มีบัญชีอยู่แล้ว เหมาะสำหรับนักเรียนโอนย้ายเข้ากลางภาค"
                        }
                    ].map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setMode(opt.id),
                            className: `text-left p-4 rounded-2xl border-2 transition-all ${mode === opt.id ? "border-primary bg-primary/4" : "border-gray-200 hover:border-gray-300"}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-2xl mb-2",
                                    children: opt.icon
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 270,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "font-bold text-sm text-base-black",
                                    children: opt.title
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 271,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-base-black/50 mt-1",
                                    children: opt.desc
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 272,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, opt.id, true, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 265,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                    lineNumber: 260,
                    columnNumber: 9
                }, this),
                mode === "new_only" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex rounded-xl border border-gray-200 overflow-hidden mb-5",
                            children: [
                                {
                                    id: "form",
                                    label: "📝 กรอกแบบฟอร์ม"
                                },
                                {
                                    id: "file",
                                    label: "📁 อัปโหลดไฟล์"
                                }
                            ].map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        setInputTab(t.id);
                                        setParseError(null);
                                        setManualError(null);
                                    },
                                    className: `flex-1 py-2.5 text-sm font-semibold transition-all ${inputTab === t.id ? "bg-primary text-white" : "bg-white text-base-black/60 hover:bg-gray-50"}`,
                                    children: t.label
                                }, t.id, false, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 285,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 280,
                            columnNumber: 13
                        }, this),
                        inputTab === "form" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                            onSubmit: handleManualSubmit,
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-3 gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-base-black/60 mb-1",
                                                    children: "คำนำหน้า"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 300,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    value: manual.prefix,
                                                    onChange: (e)=>setManual((p)=>({
                                                                ...p,
                                                                prefix: e.target.value
                                                            })),
                                                    className: "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40",
                                                    children: [
                                                        "เด็กชาย",
                                                        "เด็กหญิง",
                                                        "นาย",
                                                        "นางสาว",
                                                        "นาง"
                                                    ].map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            children: v
                                                        }, v, false, {
                                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                            lineNumber: 303,
                                                            columnNumber: 79
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 301,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                            lineNumber: 299,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-base-black/60 mb-1",
                                                    children: [
                                                        "ชื่อ ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-400",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                            lineNumber: 307,
                                                            columnNumber: 97
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 307,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: manual.first_name,
                                                    onChange: (e)=>setManual((p)=>({
                                                                ...p,
                                                                first_name: e.target.value
                                                            })),
                                                    placeholder: "สมชาย",
                                                    className: "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder:text-base-black/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 308,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                            lineNumber: 306,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-base-black/60 mb-1",
                                                    children: [
                                                        "นามสกุล ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-400",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                            lineNumber: 313,
                                                            columnNumber: 100
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 313,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: manual.last_name,
                                                    onChange: (e)=>setManual((p)=>({
                                                                ...p,
                                                                last_name: e.target.value
                                                            })),
                                                    placeholder: "ใจดี",
                                                    className: "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder:text-base-black/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 314,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                            lineNumber: 312,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 298,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-base-black/60 mb-1",
                                                    children: [
                                                        "รหัสนักศึกษา ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-400",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                            lineNumber: 323,
                                                            columnNumber: 36
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 322,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: manual.student_number,
                                                    onChange: (e)=>setManual((p)=>({
                                                                ...p,
                                                                student_number: e.target.value
                                                            })),
                                                    placeholder: "10001",
                                                    className: "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder:text-base-black/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 325,
                                                    columnNumber: 21
                                                }, this),
                                                manual.student_number && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-base-black/40 mt-1 font-mono",
                                                    children: [
                                                        "→ อีเมล: 0",
                                                        manual.student_number,
                                                        "@sukhon.ac.th"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 329,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                            lineNumber: 321,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-base-black/60 mb-1",
                                                    children: [
                                                        "รหัสบัตรประชาชน ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-400",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                            lineNumber: 334,
                                                            columnNumber: 39
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 333,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: manual.national_id,
                                                    onChange: (e)=>setManual((p)=>({
                                                                ...p,
                                                                national_id: e.target.value
                                                            })),
                                                    placeholder: "1234567890123",
                                                    className: "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder:text-base-black/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 336,
                                                    columnNumber: 21
                                                }, this),
                                                manual.national_id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-base-black/40 mt-1 font-mono",
                                                    children: [
                                                        "→ รหัสผ่าน: Skdw",
                                                        manual.national_id
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 340,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                            lineNumber: 332,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 320,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-xs font-semibold text-base-black/60 mb-1",
                                            children: "ชั้น/ห้อง"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                            lineNumber: 346,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            value: manual.class_name,
                                            onChange: (e)=>setManual((p)=>({
                                                        ...p,
                                                        class_name: e.target.value
                                                    })),
                                            placeholder: "ม.1/1",
                                            className: "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder:text-base-black/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                            lineNumber: 347,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 345,
                                    columnNumber: 17
                                }, this),
                                manualError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "w-4 h-4 shrink-0",
                                            fill: "currentColor",
                                            viewBox: "0 0 20 20",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                fillRule: "evenodd",
                                                d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z",
                                                clipRule: "evenodd"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                lineNumber: 355,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                            lineNumber: 354,
                                            columnNumber: 21
                                        }, this),
                                        manualError
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 353,
                                    columnNumber: 19
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "submit",
                                    className: "w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all",
                                    children: "ตรวจสอบข้อมูลก่อน import →"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 361,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 297,
                            columnNumber: 15
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FileUploadArea, {
                            fileInputId: fileInputId,
                            parseError: parseError,
                            onFile: handleFile
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 367,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                    lineNumber: 279,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FileUploadArea, {
                    fileInputId: fileInputId,
                    parseError: parseError,
                    onFile: handleFile
                }, void 0, false, {
                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                    lineNumber: 371,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-gray-50 rounded-2xl p-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs font-semibold text-base-black/60 mb-3",
                            children: "คอลัมน์ที่ระบบใช้จาก Excel"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 376,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-2 gap-x-6 gap-y-1.5",
                            children: [
                                [
                                    "คำนำหน้า + ชื่อ + นามสกุล",
                                    "ชื่อเต็ม"
                                ],
                                [
                                    "รหัสนักศึกษา",
                                    "อีเมล → 0{รหัส}@sukhon.ac.th"
                                ],
                                [
                                    "รหัสบัตรประชาชน",
                                    "รหัสผ่าน → Skdw{เลขบัตร}"
                                ],
                                [
                                    "ชั้น/ห้อง",
                                    "ห้องเรียน"
                                ],
                                [
                                    "สถานะ",
                                    "กรอง เฉพาะ 'กำลังศึกษา'"
                                ],
                                [
                                    "Email / Password",
                                    "ใช้ถ้ามีค่าอยู่แล้ว"
                                ]
                            ].map(([col, desc])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 text-xs",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-mono text-primary bg-primary/8 px-1.5 py-0.5 rounded",
                                            children: col
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                            lineNumber: 387,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-base-black/50",
                                            children: [
                                                "→ ",
                                                desc
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                            lineNumber: 388,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, col, true, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 386,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 377,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                    lineNumber: 375,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
            lineNumber: 258,
            columnNumber: 7
        }, this);
    }
    // ── Step 2: Preview ──────────────────────────────────────────────────────────
    if (step === 2) {
        const classCount = new Set(rows.map((r)=>r.class_name).filter(Boolean)).size;
        const missingClass = rows.filter((r)=>!r.class_name).length;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-5",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
                    children: [
                        {
                            label: "นักเรียนที่จะ import",
                            value: rows.length,
                            color: "text-primary"
                        },
                        {
                            label: "ห้องเรียน",
                            value: classCount,
                            color: "text-primary"
                        },
                        {
                            label: "ข้ามสถานะอื่น",
                            value: skippedInactive,
                            color: "text-amber-600"
                        },
                        {
                            label: "ไม่มีห้อง",
                            value: missingClass,
                            color: missingClass > 0 ? "text-amber-600" : "text-green-600"
                        }
                    ].map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-gray-50 rounded-2xl p-3 text-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `text-2xl font-black ${s.color}`,
                                    children: s.value
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 412,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-base-black/50 mt-0.5",
                                    children: s.label
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 413,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, s.label, true, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 411,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                    lineNumber: 404,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold ${mode === "new_only" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-blue-50 border-blue-200 text-blue-700"}`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "w-4 h-4 shrink-0",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            stroke: "currentColor",
                            strokeWidth: 2,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                d: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                lineNumber: 422,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 421,
                            columnNumber: 11
                        }, this),
                        mode === "new_only" ? "โหมด: เพิ่มรายชื่อใหม่ — email ที่มีบัญชีอยู่แล้วจะถูกข้ามอัตโนมัติ" : "โหมด: Import ทั้งหมด — ถ้ามี email ซ้ำจะแสดงเป็น error"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                    lineNumber: 418,
                    columnNumber: 9
                }, this),
                missingClass > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "w-4 h-4 shrink-0",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            stroke: "currentColor",
                            strokeWidth: 2,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                lineNumber: 432,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 431,
                            columnNumber: 13
                        }, this),
                        missingClass,
                        " รายการไม่มีข้อมูลห้องเรียน — จะ import ได้แต่ไม่ผูกกับห้อง"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                    lineNumber: 430,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "overflow-auto rounded-2xl border border-gray-200 max-h-80",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full text-xs",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    className: "bg-gray-50 sticky top-0",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: [
                                            "#",
                                            "ชื่อเต็ม",
                                            "Email",
                                            "รหัสนักศึกษา",
                                            "ห้อง",
                                            "รหัสผ่าน"
                                        ].map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-3 py-2 text-left font-semibold text-base-black/60 whitespace-nowrap",
                                                children: h
                                            }, h, false, {
                                                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                lineNumber: 443,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 441,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 440,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    className: "divide-y divide-gray-50",
                                    children: rows.slice(0, 200).map((r, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "hover:bg-gray-50/80",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 py-1.5 text-base-black/30 font-mono",
                                                    children: r.rowNum
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 450,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 py-1.5 text-base-black font-medium",
                                                    children: r.full_name
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 451,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 py-1.5 text-base-black/70 font-mono",
                                                    children: r.email
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 452,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 py-1.5 text-base-black/60 font-mono",
                                                    children: r.student_number || "—"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 453,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 py-1.5 text-base-black/70",
                                                    children: r.class_name || /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-amber-500",
                                                        children: "ไม่ระบุ"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                        lineNumber: 454,
                                                        columnNumber: 83
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 454,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 py-1.5 text-base-black/40 font-mono",
                                                    children: r.password ? "•••••••" : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-amber-500",
                                                        children: "default"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                        lineNumber: 455,
                                                        columnNumber: 102
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                                    lineNumber: 455,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, i, true, {
                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                            lineNumber: 449,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 447,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 439,
                            columnNumber: 11
                        }, this),
                        rows.length > 200 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-3 py-2 text-xs text-base-black/40 text-center border-t",
                            children: [
                                "แสดง 200 จาก ",
                                rows.length,
                                " รายการ"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 461,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                    lineNumber: 438,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: resetToStep1,
                            className: "px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50",
                            children: "← ย้อนกลับ"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 468,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleImport,
                            disabled: importing || rows.length === 0,
                            className: "flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-all",
                            children: importing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 476,
                                        columnNumber: 17
                                    }, this),
                                    "กำลัง import ",
                                    rows.length,
                                    " รายการ..."
                                ]
                            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-4 h-4",
                                        fill: "none",
                                        viewBox: "0 0 24 24",
                                        stroke: "currentColor",
                                        strokeWidth: 2.5,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                            lineNumber: 482,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 481,
                                        columnNumber: 17
                                    }, this),
                                    "ยืนยัน import ",
                                    rows.length,
                                    " รายการ"
                                ]
                            }, void 0, true)
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 472,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                    lineNumber: 467,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
            lineNumber: 403,
            columnNumber: 7
        }, this);
    }
    // ── Step 3: Result ───────────────────────────────────────────────────────────
    if (!result) return null;
    const hasErrors = result.errors.length > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `rounded-2xl p-5 ${hasErrors ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3 mb-4",
                        children: [
                            hasErrors ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center shrink-0",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "w-5 h-5 text-amber-700",
                                    fill: "none",
                                    viewBox: "0 0 24 24",
                                    stroke: "currentColor",
                                    strokeWidth: 2,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 504,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 503,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                lineNumber: 502,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-10 h-10 rounded-full bg-green-200 flex items-center justify-center shrink-0",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "w-5 h-5 text-green-700",
                                    fill: "currentColor",
                                    viewBox: "0 0 20 20",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        fillRule: "evenodd",
                                        d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
                                        clipRule: "evenodd"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 510,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 509,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                lineNumber: 508,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "font-bold text-base-black",
                                        children: hasErrors ? "Import เสร็จแล้ว (มีบางรายการผิดพลาด)" : "Import สำเร็จทั้งหมด! 🎉"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 515,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-base-black/60",
                                        children: [
                                            "จากไฟล์: ",
                                            fileName
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 518,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                lineNumber: 514,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                        lineNumber: 500,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-3 gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white/70 rounded-xl p-3 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-2xl font-black text-green-600",
                                        children: result.success
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 523,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs text-base-black/50",
                                        children: "สร้างบัญชีสำเร็จ"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 524,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                lineNumber: 522,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white/70 rounded-xl p-3 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-2xl font-black text-blue-500",
                                        children: result.skipped
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 527,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs text-base-black/50",
                                        children: "ข้ามที่มีอยู่แล้ว"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 528,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                lineNumber: 526,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white/70 rounded-xl p-3 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `text-2xl font-black ${result.errors.length > 0 ? "text-red-500" : "text-gray-400"}`,
                                        children: result.errors.length
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 531,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs text-base-black/50",
                                        children: "ผิดพลาด"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 534,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                lineNumber: 530,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                        lineNumber: 521,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                lineNumber: 499,
                columnNumber: 7
            }, this),
            result.errors.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-red-50 rounded-2xl border border-red-200 p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm font-bold text-red-700 mb-3",
                        children: [
                            "รายการที่ผิดพลาด (",
                            result.errors.length,
                            " รายการ)"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                        lineNumber: 541,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-1.5 max-h-48 overflow-y-auto",
                        children: result.errors.map((err, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-start gap-2 text-xs text-red-700",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-mono shrink-0",
                                        children: [
                                            "แถว ",
                                            err.row,
                                            ":"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 545,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: err.message
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                        lineNumber: 546,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, i, true, {
                                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                lineNumber: 544,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                        lineNumber: 542,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                lineNumber: 540,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: resetToStep1,
                className: "w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50 transition-all",
                children: "Import ไฟล์ใหม่"
            }, void 0, false, {
                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                lineNumber: 553,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
        lineNumber: 498,
        columnNumber: 5
    }, this);
}
_s(StudentImportWizard, "Na3m3Glue/UX653WYqTWnghk3so=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
});
_c = StudentImportWizard;
// ─── File upload area sub-component ─────────────────────────────────────────
function FileUploadArea({ fileInputId, parseError, onFile }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-base-black/50",
                        children: "ใช้ไฟล์ Excel format เดิมของโรงเรียน"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                        lineNumber: 572,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: downloadTemplate,
                        className: "flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-3.5 h-3.5",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "currentColor",
                                strokeWidth: 2.5,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                    lineNumber: 576,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                lineNumber: 575,
                                columnNumber: 11
                            }, this),
                            "ดาวน์โหลด Template"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                        lineNumber: 573,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                lineNumber: 571,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                htmlFor: fileInputId,
                onDragOver: (e)=>e.preventDefault(),
                onDrop: (e)=>{
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) onFile(f);
                },
                className: "flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/2 transition-all",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "w-7 h-7 text-green-600",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            stroke: "currentColor",
                            strokeWidth: 1.5,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                                lineNumber: 589,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 588,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                        lineNumber: 587,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-semibold text-base-black mb-1",
                        children: "อัปโหลดไฟล์ Excel (.xlsx)"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                        lineNumber: 592,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-base-black/40",
                        children: "ลากมาวาง หรือคลิกเพื่อเลือกไฟล์"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                        lineNumber: 593,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-base-black/30 mt-2",
                        children: 'รองรับ sheet "ข้อมูลนักเรียนทั้งหมด" และ "Template_Import"'
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                        lineNumber: 594,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                lineNumber: 582,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                id: fileInputId,
                type: "file",
                accept: ".xlsx,.xls",
                className: "sr-only",
                onChange: (e)=>{
                    if (e.target.files?.[0]) onFile(e.target.files[0]);
                }
            }, void 0, false, {
                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                lineNumber: 597,
                columnNumber: 7
            }, this),
            parseError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-4 h-4 mt-0.5 shrink-0",
                        fill: "currentColor",
                        viewBox: "0 0 20 20",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            fillRule: "evenodd",
                            d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z",
                            clipRule: "evenodd"
                        }, void 0, false, {
                            fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                            lineNumber: 603,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                        lineNumber: 602,
                        columnNumber: 11
                    }, this),
                    parseError
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
                lineNumber: 601,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/admin/import/StudentImportWizard.tsx",
        lineNumber: 570,
        columnNumber: 5
    }, this);
}
_c1 = FileUploadArea;
var _c, _c1;
__turbopack_refresh__.register(_c, "StudentImportWizard");
__turbopack_refresh__.register(_c1, "FileUploadArea");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_refresh__.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admin/import/ImportWizard.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, k: __turbopack_refresh__, m: module, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "default": (()=>ImportWizard)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$papaparse$2f$papaparse$2e$min$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/papaparse/papaparse.min.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/xlsx/xlsx.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_refresh__.signature();
"use client";
;
;
;
const TEMPLATES = {
    students: {
        headers: [
            "full_name",
            "email",
            "student_number",
            "class_name",
            "academic_year"
        ],
        example: [
            [
                "ด.ช. ใจดี ตั้งใจเรียน",
                "student2@school.ac.th",
                "S66002",
                "ม.4/1",
                "2567"
            ],
            [
                "ด.ญ. สมใจ รักเรียน",
                "student3@school.ac.th",
                "S66003",
                "ม.4/1",
                "2567"
            ]
        ]
    },
    teachers: {
        headers: [
            "full_name",
            "email",
            "employee_id",
            "subject"
        ],
        example: [
            [
                "ครูสมศักดิ์ ใจดี",
                "teacher2@school.ac.th",
                "T002",
                "คณิตศาสตร์"
            ],
            [
                "ครูวิมล สุขใจ",
                "teacher3@school.ac.th",
                "T003",
                "ภาษาไทย"
            ]
        ]
    },
    classes: {
        headers: [
            "name",
            "academic_year"
        ],
        example: [
            [
                "ม.4/1",
                "2567"
            ],
            [
                "ม.4/2",
                "2567"
            ],
            [
                "ม.5/1",
                "2567"
            ]
        ]
    }
};
const TYPE_LABEL = {
    students: "นักเรียน",
    teachers: "ครู",
    classes: "ชั้นเรียน"
};
function downloadTemplate(type) {
    const t = TEMPLATES[type];
    const wb = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__.utils.book_new();
    const ws = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__.utils.aoa_to_sheet([
        t.headers,
        ...t.example
    ]);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__.utils.book_append_sheet(wb, ws, "Template");
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__.writeFile(wb, `import_${type}_template.xlsx`);
}
function ImportWizard({ defaultType = "students" }) {
    _s();
    const [step, setStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [importType, setImportType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(defaultType);
    const [rows, setRows] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [fileName, setFileName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [parseError, setParseError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [importing, setImporting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const fileRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    function handleFile(file) {
        setParseError(null);
        setFileName(file.name);
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "csv") {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$papaparse$2f$papaparse$2e$min$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (res)=>{
                    if (res.errors.length) {
                        setParseError("CSV มีข้อผิดพลาด: " + res.errors[0].message);
                        return;
                    }
                    setRows(res.data);
                    setStep(2);
                }
            });
        } else if (ext === "xlsx" || ext === "xls") {
            const reader = new FileReader();
            reader.onload = (e)=>{
                const wb = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__.read(e.target?.result, {
                    type: "array"
                });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__.utils.sheet_to_json(ws, {
                    defval: ""
                });
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
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    type: importType,
                    rows
                })
            });
            const data = await res.json();
            setResult(data);
            setStep(3);
        } catch  {
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-4xl",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2 mb-8",
                children: [
                    [
                        1,
                        2,
                        3
                    ].map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? "bg-primary text-base-white" : "bg-gray-100 text-gray-400"}`,
                                    children: s
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                    lineNumber: 126,
                                    columnNumber: 13
                                }, this),
                                s < 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `h-0.5 w-12 ${step > s ? "bg-primary" : "bg-gray-100"}`
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                    lineNumber: 129,
                                    columnNumber: 23
                                }, this)
                            ]
                        }, s, true, {
                            fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                            lineNumber: 125,
                            columnNumber: 11
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "ml-2 text-sm text-base-black/50",
                        children: step === 1 ? "เลือกประเภทและอัปโหลดไฟล์" : step === 2 ? "ตรวจสอบข้อมูล" : "ผลการนำเข้า"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                lineNumber: 123,
                columnNumber: 7
            }, this),
            step === 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-6 animate-fade-in",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-bold text-primary mb-4",
                                children: "เลือกประเภทข้อมูลที่ต้องการนำเข้า"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 142,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-3 gap-3",
                                children: [
                                    "students",
                                    "teachers",
                                    "classes"
                                ].map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setImportType(t),
                                        className: `flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${importType === t ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-base-black/60 hover:border-primary/30"}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-2xl",
                                                children: t === "students" ? "👨‍🎓" : t === "teachers" ? "👩‍🏫" : "🏫"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                lineNumber: 154,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-semibold text-sm",
                                                children: TYPE_LABEL[t]
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                lineNumber: 157,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-base-black/40 text-center leading-relaxed",
                                                children: TEMPLATES[t].headers.join(", ")
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                lineNumber: 158,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, t, true, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 145,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 143,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                        lineNumber: 141,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "card flex items-center justify-between gap-4 bg-primary/3 border-primary/10",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "font-semibold text-primary text-sm",
                                        children: "ดาวน์โหลด Template"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 169,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-base-black/50 mt-0.5",
                                        children: [
                                            "ไฟล์ Excel พร้อมหัวคอลัมน์และตัวอย่างข้อมูลสำหรับ",
                                            TYPE_LABEL[importType]
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 170,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 168,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>downloadTemplate(importType),
                                className: "flex items-center gap-2 bg-primary text-base-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all shrink-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-4 h-4",
                                        fill: "none",
                                        viewBox: "0 0 24 24",
                                        stroke: "currentColor",
                                        strokeWidth: 2,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                            lineNumber: 179,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 178,
                                        columnNumber: 15
                                    }, this),
                                    "ดาวน์โหลด Template"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 174,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                        lineNumber: 167,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-bold text-primary mb-4",
                                children: "อัปโหลดไฟล์"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 187,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-primary/40 hover:bg-primary/2 transition-all cursor-pointer",
                                onClick: ()=>fileRef.current?.click(),
                                onDragOver: (e)=>e.preventDefault(),
                                onDrop: (e)=>{
                                    e.preventDefault();
                                    const f = e.dataTransfer.files[0];
                                    if (f) handleFile(f);
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-12 h-12 text-gray-300 mx-auto mb-3",
                                        fill: "none",
                                        viewBox: "0 0 24 24",
                                        stroke: "currentColor",
                                        strokeWidth: 1.5,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                            lineNumber: 199,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 198,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "font-semibold text-base-black/60",
                                        children: "ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 201,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-base-black/30 mt-1",
                                        children: "รองรับ .csv, .xlsx, .xls"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 202,
                                        columnNumber: 15
                                    }, this),
                                    fileName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 text-sm text-primary font-medium",
                                        children: fileName
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 203,
                                        columnNumber: 28
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 188,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                ref: fileRef,
                                type: "file",
                                accept: ".csv,.xlsx,.xls",
                                className: "hidden",
                                onChange: (e)=>{
                                    const f = e.target.files?.[0];
                                    if (f) handleFile(f);
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 205,
                                columnNumber: 13
                            }, this),
                            parseError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2",
                                children: parseError
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 213,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                        lineNumber: 186,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                lineNumber: 139,
                columnNumber: 9
            }, this),
            step === 2 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-6 animate-fade-in",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between mb-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "font-bold text-primary",
                                                children: "ตรวจสอบข้อมูลก่อนนำเข้า"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                lineNumber: 225,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-base-black/50 mt-0.5",
                                                children: [
                                                    "พบ ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        className: "text-primary",
                                                        children: rows.length
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                        lineNumber: 227,
                                                        columnNumber: 22
                                                    }, this),
                                                    " รายการ — นำเข้าประเภท: ",
                                                    TYPE_LABEL[importType]
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                lineNumber: 226,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 224,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: reset,
                                        className: "text-sm text-base-black/50 hover:text-primary transition-colors",
                                        children: "← เลือกไฟล์ใหม่"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 230,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 223,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-gray-100",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                        className: "w-full text-xs min-w-max",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                className: "sticky top-0 bg-gray-50",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left px-3 py-2 text-base-black/50 font-semibold",
                                                            children: "#"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                            lineNumber: 239,
                                                            columnNumber: 21
                                                        }, this),
                                                        headers.map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "text-left px-3 py-2 text-base-black/50 font-semibold",
                                                                children: h
                                                            }, h, false, {
                                                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                                lineNumber: 241,
                                                                columnNumber: 23
                                                            }, this))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                    lineNumber: 238,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                lineNumber: 237,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                className: "divide-y divide-gray-50",
                                                children: rows.slice(0, 100).map((row, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        className: "hover:bg-gray-50/80",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-2 text-base-black/30 font-mono",
                                                                children: i + 1
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                                lineNumber: 248,
                                                                columnNumber: 23
                                                            }, this),
                                                            headers.map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-3 py-2 text-base-black",
                                                                    children: String(row[h] ?? "—")
                                                                }, h, false, {
                                                                    fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                                    lineNumber: 250,
                                                                    columnNumber: 25
                                                                }, this))
                                                        ]
                                                    }, i, true, {
                                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                        lineNumber: 247,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                lineNumber: 245,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 236,
                                        columnNumber: 15
                                    }, this),
                                    rows.length > 100 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "px-3 py-2 text-xs text-base-black/40 text-center border-t",
                                        children: [
                                            "แสดง 100 จาก ",
                                            rows.length,
                                            " รายการ"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 259,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 235,
                                columnNumber: 13
                            }, this),
                            parseError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2",
                                children: parseError
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 266,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                        lineNumber: 222,
                        columnNumber: 11
                    }, this),
                    importType !== "classes" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "card bg-amber-50 border border-amber-200",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "w-5 h-5 text-amber-500 shrink-0 mt-0.5",
                                    fill: "currentColor",
                                    viewBox: "0 0 20 20",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        fillRule: "evenodd",
                                        d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z",
                                        clipRule: "evenodd"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 274,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                    lineNumber: 273,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm font-bold text-amber-800",
                                            children: [
                                                "บัญชีที่สร้างจะใช้รหัสผ่านเริ่มต้น: ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                    className: "bg-amber-100 px-1.5 py-0.5 rounded",
                                                    children: "password123"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                    lineNumber: 277,
                                                    columnNumber: 103
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                            lineNumber: 277,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-amber-700 mt-0.5",
                                            children: [
                                                "แนะนำให้แจ้งให้",
                                                TYPE_LABEL[importType],
                                                "เปลี่ยนรหัสผ่านเมื่อ login ครั้งแรก"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                            lineNumber: 278,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                    lineNumber: 276,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                            lineNumber: 272,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                        lineNumber: 271,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: reset,
                                className: "flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-base-black/60 hover:bg-gray-50",
                                children: "ยกเลิก"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 285,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleImport,
                                disabled: importing || rows.length === 0,
                                className: "flex-1 py-3 rounded-xl bg-accent text-primary font-bold text-sm hover:bg-accent/90 disabled:opacity-50 transition-all",
                                children: importing ? `กำลังนำเข้า ${rows.length} รายการ...` : `ยืนยันนำเข้า ${rows.length} รายการ`
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 288,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                        lineNumber: 284,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                lineNumber: 221,
                columnNumber: 9
            }, this),
            step === 3 && result && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-4 animate-fade-in",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "card bg-green-50 border border-green-200 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-4xl font-black text-green-600 mb-1",
                                        children: result.success
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 305,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm text-green-700 font-semibold",
                                        children: "นำเข้าสำเร็จ"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 306,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 304,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "card bg-red-50 border border-red-200 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-4xl font-black text-red-500 mb-1",
                                        children: result.errors.length
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 309,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm text-red-600 font-semibold",
                                        children: "มีข้อผิดพลาด"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 310,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 308,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                        lineNumber: 303,
                        columnNumber: 11
                    }, this),
                    result.errors.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "card border border-red-200",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-bold text-red-600 mb-3",
                                children: "รายการที่มีข้อผิดพลาด"
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 317,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-2 max-h-64 overflow-y-auto",
                                children: result.errors.map((e, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-start gap-3 text-sm bg-red-50 rounded-xl px-3 py-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-mono text-red-400 shrink-0",
                                                children: [
                                                    "แถว ",
                                                    e.row
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                lineNumber: 321,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-red-700",
                                                children: e.message
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                                lineNumber: 322,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                        lineNumber: 320,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                                lineNumber: 318,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                        lineNumber: 316,
                        columnNumber: 13
                    }, this),
                    result.success > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "card bg-green-50 border border-green-200",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-green-700 font-semibold",
                            children: [
                                "✅ นำเข้า",
                                TYPE_LABEL[importType],
                                result.success,
                                " รายการสำเร็จ",
                                importType !== "classes" && " — บัญชีพร้อมใช้งานด้วยรหัสผ่าน password123"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                            lineNumber: 331,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                        lineNumber: 330,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: reset,
                        className: "w-full py-3 rounded-xl bg-primary text-base-white font-bold text-sm hover:bg-primary/90 transition-all",
                        children: "นำเข้าข้อมูลอีกชุด"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                        lineNumber: 338,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
                lineNumber: 301,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/admin/import/ImportWizard.tsx",
        lineNumber: 121,
        columnNumber: 5
    }, this);
}
_s(ImportWizard, "gOAEk9fsigH5cKnFt0oqiC4M3To=");
_c = ImportWizard;
var _c;
__turbopack_refresh__.register(_c, "ImportWizard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_refresh__.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/(dashboard)/admin/import/page.tsx [app-rsc] (ecmascript, Next.js server component, client modules)": ((__turbopack_context__) => {

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, t: __turbopack_require_real__ } = __turbopack_context__;
{
}}),
}]);

//# sourceMappingURL=src_0817a2._.js.map