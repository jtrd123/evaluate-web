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
        setAll: (toSet: { name: string; value: string; options: Parameters<typeof cookieStore.set>[2] }[]) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
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
  password?: string;
  student_number?: string;
  class_name?: string;
  academic_year?: string;
  employee_id?: string;
  subject?: string;
  teaching_levels?: string;
  ms_email?: string;
  name?: string;
}

export interface ImportResult {
  success: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export async function POST(req: NextRequest) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    type: "students" | "teachers" | "classes";
    rows: ImportRow[];
    skipExisting?: boolean;
    updateExisting?: boolean;
    academicYear?: string;
  };
  const { type, rows, skipExisting = false, academicYear } = body;

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

  // ── Pre-fetch ALL existing auth users (handles >1000 users) ─────────────
  const existingUserMap = new Map<string, string>(); // email → auth user id
  {
    let page = 1;
    while (true) {
      const { data: authList } = await supa.auth.admin.listUsers({ perPage: 1000, page });
      for (const u of authList?.users ?? []) {
        if (u.email) existingUserMap.set(u.email.toLowerCase(), u.id);
      }
      if ((authList?.users?.length ?? 0) < 1000) break;
      page++;
    }
  }

  // ── Class resolution cache (Promise-based to prevent duplicate creates) ──
  const classCache = new Map<string, Promise<string | null>>();
  const currentThaiYear = (new Date().getFullYear() + 543).toString();

  function resolveClassId(className: string | undefined, year: string | undefined): Promise<string | null> {
    if (!className?.trim()) return Promise.resolve(null);
    const resolvedYear = year?.trim() || currentThaiYear;
    const key = `${className.trim()}|${resolvedYear}`;
    if (!classCache.has(key)) {
      classCache.set(key, (async () => {
        const { data: cls } = await supa
          .from("classes").select("id")
          .eq("name", className.trim()).eq("academic_year", resolvedYear).maybeSingle();
        if (cls) return cls.id as string;
        const { data: newCls } = await supa
          .from("classes").insert({ name: className.trim(), academic_year: resolvedYear })
          .select("id").single();
        return (newCls?.id ?? null) as string | null;
      })());
    }
    return classCache.get(key)!;
  }

  function buildProfilePayload(
    uid: string, r: ImportRow, classId: string | null,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      id: uid,
      full_name: r.full_name.trim(),
      role: type === "students" ? "student" : "teacher",
      school_id: "SCH001",
      academic_year: academicYear ?? r.academic_year?.trim() ?? null,
    };
    if (type === "students") {
      payload.student_number = r.student_number?.trim() ?? null;
      payload.class_id = classId;
    } else {
      payload.employee_id     = r.employee_id?.trim() ?? null;
      payload.subject         = r.subject?.trim() ?? null;
      payload.teaching_levels = r.teaching_levels?.trim() ?? null;
      if (r.ms_email?.trim()) payload.ms_email = r.ms_email.trim().toLowerCase();
    }
    return payload;
  }

  // ── Process a single row ──────────────────────────────────────────────────
  async function processRow(r: ImportRow, rowIndex: number): Promise<void> {
    if (!r.email?.trim() || !r.full_name?.trim()) {
      result.errors.push({ row: rowIndex + 1, message: "ต้องมี email และ full_name" });
      return;
    }

    const email = r.email.trim().toLowerCase();
    const password = r.password?.trim() || "password123";

    const { data: authData, error: authErr } = await supa.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: type === "students" ? "student" : "teacher" },
    });

    if (authErr) {
      const alreadyExists =
        authErr.message.toLowerCase().includes("already") ||
        authErr.message.includes("unique");

      if (alreadyExists) {
        if (skipExisting) { result.skipped++; return; }

        // Look up from pre-fetched map — no extra API call needed
        const existingId = existingUserMap.get(email);
        if (existingId) {
          const classId = type === "students"
            ? await resolveClassId(r.class_name, r.academic_year) : null;
          const payload = buildProfilePayload(existingId, r, classId);
          const { error: upsertErr } = await supa
            .from("profiles").upsert(payload, { onConflict: "id" });
          if (upsertErr) result.errors.push({ row: rowIndex + 1, message: upsertErr.message });
          else result.success++;
        } else {
          result.skipped++;
        }
        return;
      }

      result.errors.push({ row: rowIndex + 1, message: authErr.message });
      return;
    }

    const uid = authData.user.id;
    existingUserMap.set(email, uid); // cache newly created user

    const classId = type === "students"
      ? await resolveClassId(r.class_name, r.academic_year) : null;

    const payload = buildProfilePayload(uid, r, classId);
    const { error: profileErr } = await supa.from("profiles").insert(payload);
    if (profileErr) {
      result.errors.push({ row: rowIndex + 1, message: profileErr.message });
    } else {
      result.success++;
    }
  }

  // ── Run rows concurrently (5 at a time) ───────────────────────────────────
  const CONCURRENCY = 5;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    await Promise.all(
      rows.slice(i, i + CONCURRENCY).map((r, j) => processRow(r, i + j))
    );
  }

  return NextResponse.json(result);
}
