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

export async function GET(req: NextRequest) {
  const supa = await getAdminOrNull();
  if (!supa) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period_id = new URL(req.url).searchParams.get("period_id");
  if (!period_id) return NextResponse.json({ error: "Missing period_id" }, { status: 400 });

  const admin = serviceClient();
  const { data, error } = await admin
    .from("class_teacher_subjects")
    .select(`id, class_id, teacher_id, class:classes(id, name, academic_year), teacher:profiles!class_teacher_subjects_teacher_id_fkey(id, full_name, employee_id)`)
    .eq("period_id", period_id)
    .order("class_id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ relationships: data ?? [] });
}

export async function DELETE(req: NextRequest) {
  const supa = await getAdminOrNull();
  if (!supa) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = serviceClient();

  const { data: cts } = await admin
    .from("class_teacher_subjects")
    .select("class_id, teacher_id, period_id")
    .eq("id", id)
    .single();

  if (!cts) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Remove individual student assignments for this class-teacher-period
  const { data: classStudents } = await admin
    .from("profiles")
    .select("id")
    .eq("class_id", cts.class_id)
    .eq("role", "student");

  const studentIds = (classStudents ?? []).map((s: { id: string }) => s.id);
  if (studentIds.length > 0) {
    await admin
      .from("teacher_assignments")
      .delete()
      .eq("teacher_id", cts.teacher_id)
      .eq("period_id", cts.period_id)
      .in("student_id", studentIds);
  }

  const { error } = await admin.from("class_teacher_subjects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
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
