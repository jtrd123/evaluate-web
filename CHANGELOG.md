# Changelog — ระบบประเมินครู (Teacher Evaluation App)

All notable changes to this project are documented in this file.  
Format: `[Version] YYYY-MM-DD — Summary`

---

## [1.3.0] — 2026-05-02

### Added — รายงานและวิเคราะห์ (`/admin/reports`)
- **แท็บ: ความคืบหน้า** — Pie chart ภาพรวม + Progress bar แยกรายชั้น + Alert ชั้นที่ต่ำกว่า 50%
- **แท็บ: วิเคราะห์คะแนน** — Horizontal bar chart คะแนนแต่ละหัวข้อ, filter รายครู, Insight จุดแข็ง/จุดอ่อน, ตารางละเอียด
- **แท็บ: ข้อเสนอแนะ** — รวม text comments พร้อม filter ตามครู/ชั้น/คำค้น, Toggle แสดง/ซ่อนชื่อนักเรียน (admin only)
- **แท็บ: อันดับครู** — Top 5 พร้อมเหรียญ, ตารางครูต่ำกว่าเกณฑ์ (ปรับเกณฑ์ได้), Bar chart เปรียบเทียบตามชั้น, ตารางอันดับทั้งหมด
- เพิ่ม tab "รายงาน" ใน AdminNav

---

## [1.2.0] — 2026-05-02

### Added — Admin Features
- **Admin Layout** — Navbar + Tab navigation (ภาพรวม / แบบฟอร์ม / รายงาน / จับคู่)
- **หน้าแบบฟอร์ม** (`/admin/forms`) — รายการฟอร์ม, สร้างฟอร์มใหม่ผ่าน modal
- **หน้าจัดการคำถาม** (`/admin/forms/[formId]`) — เพิ่ม/ลบคำถาม, เลือกประเภท Rating/Text, บังคับ/ไม่บังคับ, toggle เปิด-ปิดฟอร์ม
- **หน้าจับคู่ครู–นักเรียน** (`/admin/assignments`) — เพิ่ม/ลบการจับคู่, Bulk mode เลือกนักเรียนหลายคน, ค้นหา

### Fixed — Student
- ปุ่มประเมินที่ประเมินแล้ว disabled ถูกต้อง — แก้ bug Supabase PostgREST คืน `submission` เป็น array แทน object
- เพิ่ม banner สีเขียว "ส่งการประเมินแล้ว เมื่อ [วันที่]" ในการ์ด
- หน้าประเมิน redirect กลับ dashboard ทันทีถ้าเคยส่งแล้ว (ป้องกันเข้า URL ตรง)
- `text_value` ส่ง `null` แทน empty string เมื่อไม่ได้พิมพ์

---

## [1.1.0] — 2026-05-02

### Added
- Supabase trigger `sync_role_to_user_metadata` — sync role → JWT metadata อัตโนมัติ
- SQL backfill สำหรับ users ที่มีอยู่แล้ว

### Changed — Performance
- **Middleware** ลดจาก 2 DB calls → 1 — อ่าน role จาก `user.user_metadata.role` แทน query `profiles`
- **Admin page** เปลี่ยน sequential queries → `Promise.all` parallel
- Login page redirect ตรงไปยัง `/admin`, `/teacher`, `/student` แทนผ่าน `/`
- ใช้ `window.location.href` hard redirect หลัง login เพื่อให้ session cookie ถูกอ่านใหม่

### Fixed
- แก้ redirect loop: middleware ไม่บล็อก request ถ้า role ยังไม่อยู่ใน JWT metadata

---

## [1.0.0] — 2026-05-02

### Added — Initial Release

#### Infrastructure
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS พร้อม Design System: `primary #2e006b`, `accent #ffd445`
- Supabase Auth + PostgreSQL (Cloud)
- `@supabase/ssr` สำหรับ Server Components + Middleware
- Middleware route protection แยกตาม role

#### Database Schema
- ตาราง: `profiles`, `classes`, `evaluation_forms`, `evaluation_questions`, `evaluation_periods`, `teacher_assignments`, `evaluation_submissions`, `evaluation_responses`
- Row Level Security (RLS) ทุกตาราง
- View `teacher_evaluation_results` — ตัด `student_id` ออกระดับ database
- 9 Performance indexes บน foreign keys
- Helper function `get_my_role()` สำหรับ RLS policies
- Seed data: Admin, Teacher (T001 ครูสมหญิง), Student (S66001)

#### Role: นักเรียน
- Dashboard แสดงรายชื่อครูที่ต้องประเมิน + progress bar
- การ์ดแสดงสถานะ: รอประเมิน / ประเมินแล้ว / หมดเขต
- หน้าประเมิน: Rating ดาว 1–5 พร้อม label + Text comment
- ป้องกัน double submission (frontend + DB UNIQUE constraint)

#### Role: ครู
- Dashboard แสดงคะแนนเฉลี่ย, จำนวนผู้ประเมิน, ข้อเสนอแนะ
- Bar chart คะแนนแต่ละหัวข้อ (recharts)
- ไม่แสดงชื่อ/รหัสนักเรียน (anonymous)

#### Role: Admin
- Dashboard ภาพรวม + ตารางการประเมิน
- Toggle ปิดบัง/แสดงชื่อนักเรียน
- ค้นหาในตาราง

---

## Roadmap (ยังไม่ได้ทำ)

- [ ] Export รายงานเป็น PDF / Excel
- [ ] ระบบแจ้งเตือน (Email / Line Notify) เมื่อใกล้หมดเขต
- [ ] จัดการ Users (เพิ่ม/แก้ไข/ลบ) ผ่าน Admin UI
- [ ] จัดการช่วงประเมิน (Evaluation Periods) ผ่าน Admin UI
- [ ] จัดการชั้นเรียน (Classes) ผ่าน Admin UI
- [ ] Import ข้อมูลนักเรียน/ครูจาก CSV
- [ ] Multi-period comparison (เปรียบเทียบข้ามภาคเรียน)
- [ ] Teacher self-reflection form
