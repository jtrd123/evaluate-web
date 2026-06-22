import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if this user has a profile in our system
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile) {
          // Profile found → redirect based on role
          const dest =
            profile.role === "admin"   ? "/admin"   :
            profile.role === "teacher" ? "/teacher" : "/student";
          return NextResponse.redirect(`${origin}${dest}`);
        }

        // No profile for this OAuth user — check if their email exists in system
        const supa = adminClient();
        const email = user.email ?? "";

        let emailExistsInSystem = false;
        if (email) {
          // 1. Check auth.users email match (student/same-email case)
          const { data: existingUsers } = await supa.auth.admin.listUsers({ perPage: 1000 });
          const match = existingUsers?.users?.find(
            (u) => u.email === email && u.id !== user.id
          );
          if (match) {
            const { data: matchProfile } = await supa
              .from("profiles")
              .select("id")
              .eq("id", match.id)
              .single();
            if (matchProfile) emailExistsInSystem = true;
          }

        }

        // Delete the orphaned OAuth user
        await supabase.auth.signOut();
        await supa.auth.admin.deleteUser(user.id);

        if (emailExistsInSystem) {
          // Known user but hasn't linked Microsoft yet → ask them to link from settings
          return NextResponse.redirect(`${origin}/login?error=link_required`);
        }

        // Completely unknown → not registered
        return NextResponse.redirect(`${origin}/login?error=not_registered`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
