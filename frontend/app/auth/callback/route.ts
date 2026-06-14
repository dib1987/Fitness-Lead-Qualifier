// Supabase Auth OAuth/email callback (same role as B's app/auth/callback/route.ts).
import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createSessionClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/admin", request.url));
}
