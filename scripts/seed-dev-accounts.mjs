/**
 * สร้าง dev test accounts ทั้ง 3 roles
 * รันด้วย: node scripts/seed-dev-accounts.mjs
 *
 * ต้องมี SUPABASE_SERVICE_ROLE_KEY ใน .env.local ก่อน
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// โหลด .env.local ด้วยมือ (ไม่ต้องใช้ dotenv)
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim()))
);

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_KEY  = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  ไม่พบ NEXT_PUBLIC_SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY ใน .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ACCOUNTS = [
  {
    email:    "admin@school.ac.th",
    password: "password123",
    role:     "admin",
    fullName: "ผู้ดูแลระบบ",
  },
  {
    email:    "teacher1@school.ac.th",
    password: "password123",
    role:     "teacher",
    fullName: "ครูทดสอบ",
    employeeId: "T001",
    subject:  "วิทยาศาสตร์",
  },
  {
    email:    "student1@school.ac.th",
    password: "password123",
    role:     "student",
    fullName: "นักเรียนทดสอบ",
    studentNumber: "10001",
  },
];

for (const acc of ACCOUNTS) {
  process.stdout.write(`สร้าง ${acc.role} (${acc.email})... `);

  // 1. สร้าง auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: acc.email,
    password: acc.password,
    email_confirm: true,
    user_metadata: { role: acc.role },
  });

  if (authErr) {
    console.log(`⚠️  ${authErr.message}`);
    continue;
  }

  const uid = authData.user.id;

  // 2. สร้าง profile
  const profile = {
    id:        uid,
    full_name: acc.fullName,
    role:      acc.role,
    school_id: "SCH001",
    ...(acc.role === "teacher" && {
      employee_id: acc.employeeId,
      subject:     acc.subject,
    }),
    ...(acc.role === "student" && {
      student_number: acc.studentNumber,
    }),
  };

  const { error: profileErr } = await supabase.from("profiles").insert(profile);

  if (profileErr) {
    console.log(`⚠️  profile error: ${profileErr.message}`);
  } else {
    console.log("✅");
  }
}

console.log("\nเสร็จแล้ว! ลอง login ด้วย:");
console.log("  admin@school.ac.th    — password123");
console.log("  teacher1@school.ac.th — password123");
console.log("  student1@school.ac.th — password123");
