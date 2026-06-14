// F8 — Shared lead/email status presentation (badges + dashboard bars).
export const STATUS_META: Record<string, { label: string; badgeClass: string; barColor: string }> = {
  received: { label: "Received", badgeClass: "bg-blue-50 text-blue-700", barColor: "#2563eb" },
  processing: { label: "Processing", badgeClass: "bg-amber-50 text-amber-700", barColor: "#d97706" },
  email_sent: { label: "Email Sent", badgeClass: "bg-emerald-50 text-emerald-700", barColor: "#059669" },
  email_failed: { label: "Email Failed", badgeClass: "bg-red-50 text-red-700", barColor: "#dc2626" },
  completed: { label: "Completed", badgeClass: "bg-cyan-50 text-cyan-700", barColor: "#0891b2" },
  booked: { label: "Booked", badgeClass: "bg-violet-50 text-violet-700", barColor: "#7c3aed" },
  sent: { label: "Sent", badgeClass: "bg-emerald-50 text-emerald-700", barColor: "#059669" },
  failed: { label: "Failed", badgeClass: "bg-red-50 text-red-700", barColor: "#dc2626" },
  bounce: { label: "Bounce", badgeClass: "bg-red-50 text-red-700", barColor: "#dc2626" },
  bounced: { label: "Bounced", badgeClass: "bg-red-50 text-red-700", barColor: "#dc2626" },
  complaint: { label: "Complaint", badgeClass: "bg-orange-50 text-orange-700", barColor: "#ea580c" },
};

export function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, badgeClass: "bg-stone-100 text-stone-700", barColor: "#78716c" };
}
