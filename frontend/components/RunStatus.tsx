"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";

type Props = {
  runId: string;
  accessToken: string;
};

const STEP_LABELS: Record<string, string> = {
  scoring: "Scoring your profile…",
  generating_email: "Writing your personalised email…",
  sending_email: "Sending your email…",
  syncing_crm: "Saving your details…",
  done: "All done!",
};

export default function RunStatus({ runId, accessToken }: Props) {
  const { run, error } = useRealtimeRun(runId, { accessToken });

  if (error) {
    return null;
  }

  if (!run) {
    return <p className="mt-2 text-sm text-stone-500">Processing your request…</p>;
  }

  if (run.status === "COMPLETED") {
    return <p className="mt-2 text-sm text-emerald-600">Your personalised email is on its way!</p>;
  }

  if (run.status === "FAILED" || run.status === "CRASHED" || run.status === "CANCELED") {
    return (
      <p className="mt-2 text-sm text-stone-500">
        We&apos;ve received your details — our team will follow up shortly.
      </p>
    );
  }

  const step = (run.metadata as Record<string, unknown> | undefined)?.step;
  const label =
    typeof step === "string" && STEP_LABELS[step] ? STEP_LABELS[step] : "Processing your request…";

  return <p className="mt-2 text-sm text-stone-500">{label}</p>;
}
