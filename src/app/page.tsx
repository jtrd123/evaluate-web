import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Middleware handles role-based redirect; this is a fallback for root "/"
export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin")   redirect("/admin");
  if (profile?.role === "teacher") redirect("/teacher");
  redirect("/student");
}
