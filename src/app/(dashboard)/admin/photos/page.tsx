import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PhotoUpload from "@/components/admin/PhotoUpload";
export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/login");

  const { data: teachers } = await supabase.from("profiles").select("id, full_name, employee_id, avatar_url, subject").eq("role", "teacher").order("full_name");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-black text-primary">อัปโหลดรูปโปรไฟล์ครู</h1>
        <p className="text-sm text-base-black/50 mt-1">ตั้งชื่อไฟล์เป็นรหัสครู (T0001.jpg) หรือชื่อครู ระบบจะจับคู่ให้อัตโนมัติ</p>
      </div>
      <PhotoUpload teachers={teachers ?? []} />
    </>
  );
}
