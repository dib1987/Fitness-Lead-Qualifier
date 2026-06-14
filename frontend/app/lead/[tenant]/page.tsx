import LeadForm from "@/components/LeadForm";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LeadPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const sp = await searchParams;

  const utm = {
    utm_source: typeof sp.utm_source === "string" ? sp.utm_source : undefined,
    utm_medium: typeof sp.utm_medium === "string" ? sp.utm_medium : undefined,
    utm_campaign: typeof sp.utm_campaign === "string" ? sp.utm_campaign : undefined,
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Start your fitness journey today
          </h1>
          <p className="mt-4 text-lg text-stone-600">
            Tell us a bit about your goals and we&apos;ll send you a personalized
            14-day plan, workout tips, and exclusive offers straight to your inbox.
          </p>
          <ul className="mt-8 space-y-3 text-stone-600">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-600" />
              Personalized daily guidance based on your goals
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-600" />
              Tips tailored to your nearest location
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-600" />
              No spam — unsubscribe anytime
            </li>
          </ul>
        </div>

        <LeadForm tenant={tenant} utm={utm} />
      </div>
    </main>
  );
}
