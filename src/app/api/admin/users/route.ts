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
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, string>;
  const { role = "teacher", full_name, password } = body;

  if (!full_name?.trim()) return NextResponse.json({ error: "กรุณาใส่ชื่อ-นามสกุล" }, { status: 400 });
  if (!password || password.length < 6) return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });

  const supa = adminClient();
  let email: string;
  let profileFields: Record<string, unknown>;

  if (role === "teacher") {
    const { employee_id, subject, teaching_levels } = body;
    if (!employee_id?.trim()) return NextResponse.json({ error: "กรุณาใส่รหัสครู" }, { status: 400 });
    email = `${employee_id.trim().toLowerCase()}@sukhon.ac.th`;
    profileFields = {
      full_name: full_name.trim(),
      employee_id: employee_id.trim(),
      subject: subject?.trim() || null,
      teaching_levels: teaching_levels?.trim() || null,
      role: "teacher",
    };
  } else {
    // student
    const { student_number, class_id } = body;
    if (!student_number?.trim()) return NextResponse.json({ error: "กรุณาใส่รหัสนักเรียน" }, { status: 400 });
    email = `${student_number.trim()}@sukhon.ac.th`;
    profileFields = {
      full_name: full_name.trim(),
      student_number: student_number.trim(),
      class_id: class_id || null,
      role: "student",
    };
  }

  // Create auth user
  const { data: authData, error: authError } = await supa.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name.trim(), role },
  });

  if (authError) {
    const msg = authError.message.includes("already been registered")
      ? "รหัสนี้มีบัญชีอยู่แล้ว"
      : authError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Create profile
  const { data: profileData, error: profileError } = await supa
    .from("profiles")
    .insert({ id: authData.user.id, ...profileFields })
    .select()
    .single();

  if (profileError) {
    await supa.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ user: profileData, email });
}
