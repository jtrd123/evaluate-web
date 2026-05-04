import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Single network call — reads role from JWT user_metadata (no DB query)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/auth/callback"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Role comes from JWT metadata — zero extra DB round-trip
  const role = user.user_metadata?.role as string | undefined;

  if (pathname === "/") {
    const dest = request.nextUrl.clone();
    dest.pathname =
      role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/student";
    return NextResponse.redirect(dest);
  }

  const roleGuards: Record<string, string> = {
    "/admin": "admin",
    "/teacher": "teacher",
    "/student": "student",
  };

  // Only block if role is known and mismatched — avoids redirect loop when metadata not set yet
  for (const [prefix, requiredRole] of Object.entries(roleGuards)) {
    if (pathname.startsWith(prefix) && role && role !== requiredRole) {
      const dest = request.nextUrl.clone();
      dest.pathname = "/login";
      return NextResponse.redirect(dest);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
