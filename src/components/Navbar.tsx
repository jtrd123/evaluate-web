"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database.types";

interface NavbarProps {
  profile: Pick<Profile, "full_name" | "role" | "avatar_url">;
}

const roleLabel: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  teacher: "ครูผู้สอน",
  student: "นักเรียน",
};

export default function Navbar({ profile }: NavbarProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = profile.full_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="bg-primary shadow-lg sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
          </div>
          <span className="text-base-white font-bold text-lg tracking-tight group-hover:text-accent transition-colors">
            ระบบประเมินครู
          </span>
        </Link>

        {/* User info + sign out */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-base-white text-sm font-semibold leading-tight">
              {profile.full_name}
            </span>
            <span className="text-accent text-xs font-medium">
              {roleLabel[profile.role] ?? profile.role}
            </span>
          </div>

          {/* Avatar */}
          <Link
            href="/settings"
            className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-primary text-sm font-bold shadow-sm hover:bg-accent/80 transition-colors"
            title="ตั้งค่า / เปลี่ยนรหัสผ่าน"
          >
            {initials}
          </Link>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-base-white/70 hover:text-accent text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
