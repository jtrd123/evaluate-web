import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getAdminOrNull() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (toSet: { name: string; value: string; options: Parameters<typeof cookieStore.set>[2] }[]) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
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

// POST /api/admin/users/batch-reset-password
// body: { year: string | null }
// Resets every student's password to their student_number
export async function POST(req: NextRequest) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { year } = await req.json() as { year: string | null };

  const supa = adminClient();

  // Find target student profiles
  let profileIds: Array<{ id: string; student_number: string | null }> = [];

  if (year) {
    const [byProfile, byClass] = await Promise.all([
      supa.from("profiles").select("id, student_number").eq("role", "student").eq("academic_year", year),
      supa.from("classes").select("id").eq("academic_year", year),
    ]);
    const classIds = (byClass.data ?? []).map((c: { id: string }) => c.id);
    const byClassStudents = classIds.length > 0
      ? await supa.from("profiles").select("id, student_number").eq("role", "student").in("class_id", classIds)
      : { data: [] };

    const seen = new Set<string>();
    const combined = [
      ...(byProfile.data ?? []),
      ...(byClassStudents.data ?? []),
    ] as Array<{ id: string; student_number: string | null }>;

    for (const p of combined) {
      if (!seen.has(p.id)) { seen.add(p.id); profileIds.push(p); }
    }
  } else {
    const { data } = await supa.from("profiles").select("id, student_number").eq("role", "student");
    profileIds = (data ?? []) as Array<{ id: string; student_number: string | null }>;
  }

  if (profileIds.length === 0) return NextResponse.json({ reset: 0 });

  let reset = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const p of profileIds) {
    const password = p.student_number?.trim();
    if (!password) { skipped++; continue; }

    const { error } = await supa.auth.admin.updateUserById(p.id, { password });
    if (error) errors.push(`${p.id}: ${error.message}`);
    else reset++;
  }

  return NextResponse.json({ reset, skipped, errors });
}
