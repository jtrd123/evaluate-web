import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

        if (!profile) {
          // User authenticated with Microsoft but is NOT in our system → reject
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=not_registered`);
        }

        // Redirect based on role
        const dest =
          profile.role === "admin"   ? "/admin"   :
          profile.role === "teacher" ? "/teacher" : "/student";
        return NextResponse.redirect(`${origin}${dest}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
