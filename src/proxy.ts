import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthRoute      = request.nextUrl.pathname.startsWith("/auth");
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isRisksRoute     = request.nextUrl.pathname.startsWith("/risks");
  const isAdminRoute     = request.nextUrl.pathname.startsWith("/admin");
  const isUsersRoute     = request.nextUrl.pathname.startsWith("/users");
  const isNotifRoute     = request.nextUrl.pathname.startsWith("/notifications");
  const isRiskGenRoute   = request.nextUrl.pathname.startsWith("/risk-generator");
  const isApiRoute       = request.nextUrl.pathname.startsWith("/api");

  const isProtectedRoute = isDashboardRoute || isRisksRoute || isAdminRoute ||
    isUsersRoute || isNotifRoute || isRiskGenRoute || isApiRoute

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (isAuthRoute && user && !request.nextUrl.pathname.startsWith("/auth/callback")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon\\.svg|icon\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
