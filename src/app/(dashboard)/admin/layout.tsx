import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar profile={{ full_name: profile.full_name, role: "admin", avatar_url: profile.avatar_url }} />
      <AdminNav />
      <main className="page-container">{children}</main>
    </div>
  );
}
