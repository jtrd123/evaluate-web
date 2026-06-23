import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getAdminOrNull() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (t) => t.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
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

export async function DELETE(req: NextRequest) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { year, role } = await req.json() as { year: string | null; role: "student" | "teacher" };
  if (!role) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const supa = adminClient();
  let profileIds: string[] = [];

  if (role === "teacher") {
    let q = supa.from("profiles").select("id").eq("role", "teacher");
    if (year) q = q.eq("academic_year", year);
    const { data } = await q;
    profileIds = (data ?? []).map((p: { id: string }) => p.id);
  } else {
    if (year) {
      // Students: match via academic_year on profile OR via class's academic_year
      const [byProfile, byClass] = await Promise.all([
        supa.from("profiles").select("id").eq("role", "student").eq("academic_year", year),
        supa.from("classes").select("id").eq("academic_year", year),
      ]);
      const classIds = (byClass.data ?? []).map((c: { id: string }) => c.id);
      const byClassStudents = classIds.length > 0
        ? await supa.from("profiles").select("id").eq("role", "student").in("class_id", classIds)
        : { data: [] };
      const allIds = new Set([
        ...(byProfile.data ?? []).map((p: { id: string }) => p.id),
        ...(byClassStudents.data ?? []).map((p: { id: string }) => p.id),
      ]);
      profileIds = Array.from(allIds);
    } else {
      // Delete ALL students
      const { data } = await supa.from("profiles").select("id").eq("role", "student");
      profileIds = (data ?? []).map((p: { id: string }) => p.id);
    }
  }

  if (profileIds.length === 0) return NextResponse.json({ deleted: 0 });

  let deleted = 0;
  const errors: string[] = [];
  for (const id of profileIds) {
    const { error } = await supa.auth.admin.deleteUser(id);
    if (error) errors.push(`${id}: ${error.message}`);
    else deleted++;
  }

  return NextResponse.json({ deleted, errors });
}
