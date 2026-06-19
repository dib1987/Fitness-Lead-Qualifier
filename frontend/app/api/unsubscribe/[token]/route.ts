// F9 — Legacy unsubscribe endpoint. Redirects to the branded page at
// /unsubscribe/[token] which handles the DB work idempotently.
// Kept so any emails sent before the page existed continue to work.
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  return NextResponse.redirect(
    new URL(`/unsubscribe/${token}`, _req.url),
    { status: 301 }
  );
}
