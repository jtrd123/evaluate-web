import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getAdminOrNull() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export interface ImportRow {
  full_name: string;
  email: string;
  password?: string;          // use actual password from Excel when available
  student_number?: string;
  class_name?: string;
  academic_year?: string;
  employee_id?: string;
  subject?: string;
  teaching_levels?: string;   // e.g. "ม.2, ม.3, ม.4"
  name?: string;              // for class imports
}

export interface ImportResult {
  success: number;
  skipped: number;            // existing accounts skipped (add-only mode)
  errors: { row: number; message: string }[];
}

export async function POST(req: NextRequest) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    type: "students" | "teachers" | "classes";
    rows: ImportRow[];
    skipExisting?: boolean;   // true = skip if email already exists (add-new mode)
  };
  const { type, rows, skipExisting = false } = body;

  if (!type || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supa = adminClient();
  const result: ImportResult = { success: 0, skipped: 0, errors: [] };

  if (type === "classes") {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.name?.trim() || !r.academic_year?.trim()) {
        result.errors.push({ row: i + 1, message: "ต้องมีชื่อชั้นและปีการศึกษา" });
        continue;
      }
      const { error } = await supa.from("classes").insert({
        name: r.name.trim(),
        academic_year: r.academic_year.trim(),
      });
      if (error) {
        result.errors.push({ row: i + 1, message: error.message });
      } else {
        result.success++;
      }
    }
    return NextResponse.json(result);
  }

  // Cache class lookups to avoid N+1 queries
  const classCache = new Map<string, string | null>();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r.email?.trim() || !r.full_name?.trim()) {
      result.errors.push({ row: i + 1, message: "ต้องมี email และ full_name" });
      continue;
    }

    const email = r.email.trim().toLowerCase();

    // 1. Create auth user — use actual password from Excel or fall back to default
    const password = r.password?.trim() || "password123";

    const { data: authData, error: authErr } = await supa.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: type === "students" ? "student" : "teacher" },
    });

    if (authErr) {
      const alreadyExists = authErr.message.toLowerCase().includes("already") ||
                            authErr.message.includes("unique");
      if (alreadyExists && skipExisting) {
        result.skipped++;
        continue;
      }
      if (alreadyExists) {
        result.errors.push({ row: i + 1, message: `${email} มีบัญชีอยู่แล้ว` });
      } else {
        result.errors.push({ row: i + 1, message: authErr.message });
      }
      continue;
    }

    const uid = authData.user.id;

    // 2. Look up class_id (students only) — use cache
    let classId: string | null = null;
    if (type === "students" && r.class_name?.trim()) {
      const cacheKey = `${r.class_name.trim()}|${r.academic_year?.trim() ?? ""}`;
      if (!classCache.has(cacheKey)) {
        const query = supa.from("classes").select("id").eq("name", r.class_name.trim());
        if (r.academic_year?.trim()) query.eq("academic_year", r.academic_year.trim());
        const { data: cls } = await query.maybeSingle();
        classCache.set(cacheKey, cls?.id ?? null);
      }
      classId = classCache.get(cacheKey) ?? null;
    }

    // 3. Insert profile
    const profilePayload: Record<string, unknown> = {
      id: uid,
      full_name: r.full_name.trim(),
      role: type === "students" ? "student" : "teacher",
      school_id: "SCH001",
    };
    if (type === "students") {
      profilePayload.student_number = r.student_number?.trim() ?? null;
      profilePayload.class_id = classId;
    } else {
      profilePayload.employee_id     = r.employee_id?.trim() ?? null;
      profilePayload.subject         = r.subject?.trim() ?? null;
      profilePayload.teaching_levels = r.teaching_levels?.trim() ?? null;
    }

    const { error: profileErr } = await supa.from("profiles").insert(profilePayload);
    if (profileErr) {
      result.errors.push({ row: i + 1, message: profileErr.message });
    } else {
      result.success++;
    }
  }

  return NextResponse.json(result);
}
