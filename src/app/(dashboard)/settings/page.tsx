import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, employee_id, student_number, subject")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const email = user.email ?? "";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar profile={{ full_name: profile.full_name, role: profile.role, avatar_url: profile.avatar_url }} />
      <main className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-black text-primary mb-6">ตั้งค่าบัญชี</h1>

        {/* Profile info (read-only) */}
        <div className="card mb-6">
          <h2 className="text-sm font-bold text-base-black/50 uppercase tracking-wide mb-4">ข้อมูลบัญชี</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
              {profile.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-primary text-lg">{profile.full_name}</p>
              <p className="text-sm text-base-black/50">{email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-xs text-base-black/40 font-semibold mb-0.5">บทบาท</p>
              <p className="font-semibold text-base-black">
                {profile.role === "admin" ? "ผู้ดูแลระบบ" : profile.role === "teacher" ? "ครูผู้สอน" : "นักเรียน"}
              </p>
            </div>
            {profile.employee_id && (
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-base-black/40 font-semibold mb-0.5">รหัสครู</p>
                <p className="font-semibold text-base-black font-mono">{profile.employee_id}</p>
              </div>
            )}
            {profile.student_number && (
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-base-black/40 font-semibold mb-0.5">รหัสนักเรียน</p>
                <p className="font-semibold text-base-black font-mono">{profile.student_number}</p>
              </div>
            )}
            {profile.subject && (
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-base-black/40 font-semibold mb-0.5">กลุ่มสาระ</p>
                <p className="font-semibold text-base-black">{profile.subject}</p>
              </div>
            )}
          </div>
        </div>

        {/* Change password */}
        <ChangePasswordForm />
      </main>
    </div>
  );
}
