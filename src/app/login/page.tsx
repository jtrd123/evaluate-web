"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

function getUrlError(code: string | null): { msg: string; hint?: string } | null {
  if (code === "not_registered")
    return { msg: "บัญชี Microsoft นี้ไม่ได้ลงทะเบียนในระบบ กรุณาติดต่อผู้ดูแลระบบ" };
  if (code === "auth_callback_failed")
    return { msg: "การเชื่อมต่อล้มเหลว กรุณาลองใหม่" };
  if (code === "link_required")
    return {
      msg: "บัญชี Microsoft นี้ยังไม่ได้เชื่อมต่อกับระบบ",
      hint: "กรุณาเข้าสู่ระบบด้วยรหัสผ่านก่อน แล้วไปเชื่อมต่อ Microsoft ที่หน้า ตั้งค่า",
    };
  return null;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const urlErrorMsg = getUrlError(searchParams.get("error"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlErrorMsg?.msg ?? null);
  const urlHint = urlErrorMsg?.hint ?? null;

  const supabase = createClient();

  async function handleMicrosoftLogin() {
    setLoading(true);
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "email profile openid",
      },
    });
    if (oauthError) {
      setError("ไม่สามารถเชื่อมต่อ Microsoft ได้ กรุณาลองใหม่");
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Allow short username (T0001 or 10001) — auto-append @sukhon.ac.th
    const raw = email.trim().toLowerCase();
    const fullEmail = raw.includes("@") ? raw : `${raw}@sukhon.ac.th`;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: fullEmail,
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

          {/* Microsoft login — primary for staff */}
          <button
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-[#0078d4]/30 bg-[#0078d4]/5 hover:bg-[#0078d4]/10 hover:border-[#0078d4]/50 transition-all text-sm font-bold text-[#0078d4] disabled:opacity-50 mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
            เข้าสู่ระบบด้วย Microsoft 365
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-base-black/30 font-medium">หรือใช้รหัสผ่าน</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-base-black/70 mb-1.5">
                อีเมล / รหัสประจำตัว
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="T0001 หรือ T0001@sukhon.ac.th"
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
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-start gap-2">
                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p>{error}</p>
                  {urlHint && <p className="mt-1 text-red-600/80 text-xs">{urlHint}</p>}
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-1">
              เข้าสู่ระบบ
            </Button>
          </form>
        </div>

        {/* Login hint */}
        <div className="mt-4 text-center space-y-1">
          <p className="text-xs text-base-black/40 leading-relaxed">
            ครู: <span className="font-mono text-primary/70">T0001</span> / นักเรียน: <span className="font-mono text-primary/70">10001</span>
          </p>
          <p className="text-xs text-base-black/30">
            รหัสผ่าน: <span className="font-mono">Skdw + เลขบัตรประชาชน</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
