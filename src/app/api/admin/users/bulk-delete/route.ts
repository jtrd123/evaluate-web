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

// Paginate through ALL profile IDs — bypasses Supabase's 1000-row default limit
async function fetchAllProfileIds(
  supa: ReturnType<typeof adminClient>,
  role: "student" | "teacher",
  year: string | null,
  excludeId: string,
): Promise<string[]> {
  const PAGE = 1000;
  const ids: string[] = [];

  if (role === "teacher") {
    let from = 0;
    while (true) {
      let q = supa.from("profiles").select("id")
        .eq("role", "teacher")
        .neq("id", excludeId)
        .range(from, from + PAGE - 1);
      if (year) q = q.eq("academic_year", year);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      for (const p of data ?? []) ids.push(p.id);
      if ((data?.length ?? 0) < PAGE) break;
      from += PAGE;
    }
  } else {
    const seen = new Set<string>();

    // Fetch by profile.academic_year
    let from = 0;
    while (true) {
      let q = supa.from("profiles").select("id")
        .eq("role", "student")
        .range(from, from + PAGE - 1);
      if (year) q = q.eq("academic_year", year);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      for (const p of data ?? []) {
        if (!seen.has(p.id)) { seen.add(p.id); ids.push(p.id); }
      }
      if ((data?.length ?? 0) < PAGE) break;
      from += PAGE;
    }

    // Also fetch via class.academic_year (catches students whose profile.academic_year is null)
    if (year) {
      const { data: classDat } = await supa.from("classes").select("id").eq("academic_year", year);
      const classIds = (classDat ?? []).map((c: { id: string }) => c.id);
      if (classIds.length > 0) {
        let cfrom = 0;
        while (true) {
          const { data } = await supa.from("profiles").select("id")
            .eq("role", "student")
            .in("class_id", classIds)
            .range(cfrom, cfrom + PAGE - 1);
          for (const p of data ?? []) {
            if (!seen.has(p.id)) { seen.add(p.id); ids.push(p.id); }
          }
          if ((data?.length ?? 0) < PAGE) break;
          cfrom += PAGE;
        }
      }
    }
  }

  return ids;
}

// Delete one auth user with up to `retries` attempts and exponential back-off
async function deleteAuthUserWithRetry(
  supa: ReturnType<typeof adminClient>,
  id: string,
  retries = 3,
): Promise<{ ok: boolean; err?: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const { error } = await supa.auth.admin.deleteUser(id);
    if (!error) return { ok: true };
    if (error.message.toLowerCase().includes("not found")) return { ok: true };
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 300 * attempt)); // 300ms, 600ms back-off
    } else {
      return { ok: false, err: error.message };
    }
  }
  return { ok: false, err: "max retries exceeded" };
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { year, role } = await req.json() as { year: string | null; role: "student" | "teacher" };
  if (!role) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const supa = adminClient();

  // ── 1. Collect ALL profile IDs (paginated — never stops at 1000) ──────────
  let profileIds: string[];
  try {
    profileIds = await fetchAllProfileIds(supa, role, year, admin.id);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  if (profileIds.length === 0) return NextResponse.json({ deleted: 0, profilesRemoved: 0 });

  // ── 2. Delete profiles in chunks of 500 (CASCADE wipes all child-table rows)
  const CHUNK = 500;
  let profilesRemoved = 0;
  const profileErrors: string[] = [];

  for (let i = 0; i < profileIds.length; i += CHUNK) {
    const slice = profileIds.slice(i, i + CHUNK);
    const { error } = await supa.from("profiles")
      .delete()
      .in("id", slice)
      .neq("role", "admin"); // safety: never delete admins
    if (error) {
      profileErrors.push(`batch ${Math.floor(i / CHUNK) + 1}: ${error.message}`);
    } else {
      profilesRemoved += slice.length;
    }
  }

  if (profilesRemoved === 0 && profileErrors.length > 0) {
    return NextResponse.json({ error: profileErrors[0], profileErrors }, { status: 500 });
  }

  // ── 3. Delete auth users — concurrency 10 + retry 3x (avoids rate-limiting)
  const CONCURRENCY = 10;
  let deleted = 0;
  const authErrors: string[] = [];

  for (let i = 0; i < profileIds.length; i += CONCURRENCY) {
    const batch = profileIds.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((id) => deleteAuthUserWithRetry(supa, id))
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        if (r.value.ok) deleted++;
        else if (r.value.err) authErrors.push(r.value.err);
      } else {
        authErrors.push(String(r.reason));
      }
    }
  }

  return NextResponse.json({
    deleted,
    profilesRemoved,
    profileErrors,
    authErrors: authErrors.slice(0, 10),
  });
}
