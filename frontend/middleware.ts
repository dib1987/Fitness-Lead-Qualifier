// Admin route protection. NAMED middleware.ts ON PURPOSE — Repo B calls this
// proxy.ts and it never runs. This is one of the three deliberate fixes vs. B.
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet: { name: string; value: string; options: CookieOptions }[]) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Only the admin dashboard pages are gated. Public lead form + webhooks are open
  // (webhooks self-verify signatures; lead form is public by design).
  // Sign-in/sign-up pages must stay open to unauthenticated users, or this redirect loops.
  const isAuthPage = path === "/admin/sign-in" || path === "/admin/sign-up";
  if (path.startsWith("/admin") && !isAuthPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/sign-in";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
