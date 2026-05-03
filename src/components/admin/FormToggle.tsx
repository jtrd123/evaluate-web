"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FormToggle({ formId, isActive }: { formId: string; isActive: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("evaluation_forms").update({ is_active: !active }).eq("id", formId);
    setActive((p) => !p);
    setSaving(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all shrink-0 ${
        active
          ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
      } disabled:opacity-50`}
    >
      <span className={`w-2 h-2 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`} />
      {active ? "เปิดใช้งาน" : "ปิดอยู่"}
    </button>
  );
}
