"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError || !authData.user) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (!profile) {
      window.location.href = "/";
      return;
    }

    const dest =
      profile.role === "admin"
        ? "/admin"
        : profile.role === "teacher"
        ? "/teacher"
        : "/student";

    window.location.href = dest;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-primary rounded-2xl items-center justify-center shadow-lg mb-4">
            <svg className="w-9 h-9 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-primary">ระบบประเมินครู</h1>
          <p className="text-base-black/50 text-sm mt-1">Teacher Evaluation System</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="text-lg font-bold text-primary mb-6">เข้าสู่ระบบ</h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-base-black/70 mb-1.5">
                อีเมล
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="your@school.ac.th"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-base-black placeholder:text-base-black/30 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-base-black/70 mb-1.5">
                รหัสผ่าน
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-base-black placeholder:text-base-black/30 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-1">
              เข้าสู่ระบบ
            </Button>
          </form>
        </div>

        {/* Student login hint */}
        <div className="mt-4 text-center">
          <p className="text-xs text-base-black/40 leading-relaxed">
            นักเรียน: ใช้ <span className="font-mono text-primary/70">รหัสนักศึกษา@sukhon.ac.th</span>
            <br />
            รหัสผ่าน: <span className="font-mono text-primary/70">Skdw + เลขบัตรประชาชน</span>
          </p>
        </div>
      </div>
    </div>
  );
}
