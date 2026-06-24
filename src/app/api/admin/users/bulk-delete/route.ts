import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

async function getAdminOrNull() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet: { name: string; value: string; options: Parameters<typeof cookieStore.set>[2] }[]) =>
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
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

export async function DELETE(req: NextRequest) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { year, role } = await req.json() as { year: string | null; role: "student" | "teacher" };
  if (!role) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const supa = adminClient();

  // ── 1. Collect profile IDs (never include admins) ─────────────────────────
  let profileIds: string[] = [];

  if (role === "teacher") {
    const { data, error } = await supa.from("profiles").select("id")
      .eq("role", "teacher")
      .neq("id", admin.id); // never delete the caller's own profile
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (year) {
      const { data: yearData } = await supa.from("profiles").select("id")
        .eq("role", "teacher").eq("academic_year", year).neq("id", admin.id);
      profileIds = (yearData ?? []).map((p: { id: string }) => p.id);
    } else {
      profileIds = (data ?? []).map((p: { id: string }) => p.id);
    }
  } else {
    if (year) {
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
      const { data, error } = await supa.from("profiles").select("id").eq("role", "student");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      profileIds = (data ?? []).map((p: { id: string }) => p.id);
    }
  }

  if (profileIds.length === 0) return NextResponse.json({ deleted: 0, profilesRemoved: 0 });

  // ── 2. Delete profiles in batch (cascades to all child tables) ─────────────
  const CHUNK = 500;
  const profileErrors: string[] = [];
  let profilesRemoved = 0;

  for (let i = 0; i < profileIds.length; i += CHUNK) {
    const { error } = await supa.from("profiles")
      .delete()
      .in("id", profileIds.slice(i, i + CHUNK))
      .neq("role", "admin"); // safety: never delete admins
    if (error) {
      profileErrors.push(`profile batch ${i / CHUNK + 1}: ${error.message}`);
    } else {
      profilesRemoved += profileIds.slice(i, i + CHUNK).length;
    }
  }

  // If profile deletion failed entirely, abort and report
  if (profilesRemoved === 0 && profileErrors.length > 0) {
    return NextResponse.json({ error: profileErrors[0], profileErrors }, { status: 500 });
  }

  // ── 3. Delete auth users concurrently (50 at a time) ──────────────────────
  let deleted = 0;
  const authErrors: string[] = [];
  const CONCURRENCY = 50;

  for (let i = 0; i < profileIds.length; i += CONCURRENCY) {
    const batch = profileIds.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((id) => supa.auth.admin.deleteUser(id))
    );
    for (const r of results) {
      if (r.status === "fulfilled" && !r.value.error) deleted++;
      else if (r.status === "fulfilled" && r.value.error) {
        // "User not found" is fine — profile was already deleted
        if (!r.value.error.message.includes("not found")) {
          authErrors.push(r.value.error.message);
        } else {
          deleted++;
        }
      } else if (r.status === "rejected") {
        authErrors.push(String(r.reason));
      }
    }
  }

  return NextResponse.json({
    deleted,
    profilesRemoved,
    profileErrors,
    authErrors: authErrors.slice(0, 10), // cap to avoid huge response
  });
}
