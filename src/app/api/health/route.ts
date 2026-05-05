import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Ping Supabase to keep it alive
    const supabase = await createClient();
    await supabase.from("system_settings").select("key").limit(1);
    return NextResponse.json({ ok: true, time: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
