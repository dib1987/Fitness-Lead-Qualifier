// Branded unsubscribe confirmation page. Server component — does the DB work
// on render so the link in any email client works with a single GET request.
// Idempotent: re-visiting after already unsubscribed shows the same confirmation.
import { createServiceClient } from "@/lib/supabase";

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const db = createServiceClient();

  let alreadyDone = false;
  let success = false;

  if (token) {
    // Check if already unsubscribed
    const { data: alreadyUnsub } = await db
      .from("leads")
      .select("id")
      .eq("unsubscribe_token", token)
      .not("unsubscribed_at", "is", null)
      .maybeSingle();

    if (alreadyUnsub) {
      alreadyDone = true;
      success = true;
    } else {
      // Find active lead with this token
      const { data: lead } = await db
        .from("leads")
        .select("id")
        .eq("unsubscribe_token", token)
        .is("unsubscribed_at", null)
        .maybeSingle();

      if (lead) {
        await db
          .from("leads")
          .update({ unsubscribed_at: new Date().toISOString() })
          .eq("id", lead.id);
        await db
          .from("campaign_enrollments")
          .update({ status: "paused" })
          .eq("lead_id", lead.id)
          .eq("status", "active");
        success = true;
      }
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Brand mark */}
        <div className="flex items-center gap-2 mb-10">
          <span className="h-3 w-3 rounded-full bg-amber-600 flex-shrink-0" />
          <span className="text-base font-bold text-stone-900 tracking-tight">
            Crunch Fitness
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
          {success ? (
            <>
              <div className="mb-5">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-amber-50 border border-amber-100 mb-4">
                  <svg
                    className="h-6 w-6 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-stone-900 mb-2">
                  {alreadyDone ? "Already unsubscribed" : "You've been unsubscribed"}
                </h1>
                <p className="text-stone-600 text-sm leading-relaxed">
                  {alreadyDone
                    ? "You were already removed from our mailing list. You won't receive any more emails from us."
                    : "We've removed you from our mailing list. You won't receive any more emails from us."}
                </p>
              </div>

              <div className="border-t border-stone-100 pt-5 mt-5">
                <p className="text-xs text-stone-400 leading-relaxed">
                  Changed your mind? You can always walk into any Crunch Fitness
                  location and speak with our team directly — we'd love to see you.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-5">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-stone-100 border border-stone-200 mb-4">
                  <svg
                    className="h-6 w-6 text-stone-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-stone-900 mb-2">
                  Link not recognised
                </h1>
                <p className="text-stone-600 text-sm leading-relaxed">
                  This unsubscribe link is invalid or has expired. If you'd like
                  to stop receiving emails, please reply directly to any email
                  from us and we'll remove you right away.
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          Crunch Fitness · All rights reserved
        </p>
      </div>
    </main>
  );
}
