"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  isLinked: boolean;
}

export default function MicrosoftLinkButton({ isLinked }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleLink() {
    setLoading(true);
    setError(null);
    const { error: linkError } = await supabase.auth.linkIdentity({
      provider: "azure",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "email profile openid",
      },
    });
    if (linkError) {
      setError("ไม่สามารถเชื่อมต่อ Microsoft ได้ กรุณาลองใหม่");
      setLoading(false);
    }
    // On success → browser redirects to Microsoft login page
  }

  if (isLinked) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
        <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
          <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
          <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
          <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
        </svg>
        <div className="flex-1">
          <p className="text-sm font-bold text-green-700">เชื่อมต่อ Microsoft 365 แล้ว</p>
          <p className="text-xs text-green-600/70 mt-0.5">คุณสามารถ login ด้วย Microsoft ได้</p>
        </div>
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleLink}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-[#0078d4]/30 bg-[#0078d4]/5 hover:bg-[#0078d4]/10 hover:border-[#0078d4]/50 transition-all text-sm font-bold text-[#0078d4] disabled:opacity-50"
      >
        {loading ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
        )}
        เชื่อมต่อ Microsoft 365
      </button>
      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}
      <p className="text-xs text-base-black/40 text-center">
        หลังจากเชื่อมต่อแล้ว จะสามารถ login ด้วย Microsoft ได้ทันที
      </p>
    </div>
  );
}
