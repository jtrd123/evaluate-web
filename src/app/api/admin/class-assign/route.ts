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
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin" ? supabase : null;
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const supa = await getAdminOrNull();
  if (!supa) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    class_id: string;
    teacher_id: string;
    form_id: string;
    period_id: string;
  };

  const { class_id, teacher_id, form_id, period_id } = body;
  if (!class_id || !teacher_id || !form_id || !period_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = serviceClient();

  // Insert into class_teacher_subjects (upsert to avoid duplicates)
  const { data: cts, error: ctsErr } = await admin
    .from("class_teacher_subjects")
    .upsert({ class_id, teacher_id, form_id, period_id }, { onConflict: "class_id,teacher_id,period_id" })
    .select("id")
    .single();

  if (ctsErr) return NextResponse.json({ error: ctsErr.message }, { status: 500 });

  // Call sync_class_assignments to bulk-create individual teacher_assignments
  const { data: count, error: syncErr } = await admin.rpc("sync_class_assignments", {
    p_cts_id: cts.id,
  });

  if (syncErr) return NextResponse.json({ error: syncErr.message }, { status: 500 });

  return NextResponse.json({ assigned: count ?? 0 });
}
