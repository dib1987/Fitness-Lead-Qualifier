import Link from "next/link";

// F8 — Admin dashboard (gated by middleware.ts). Rebuild of admin/index.html.
// Reads via the session client so RLS scopes data to the admin's tenant.
export default function AdminDashboard() {
  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Dashboard</h1>
      <p>Leads, scores, email history, audit trail. TODO: render from /api/admin/*.</p>
      <p className="mt-4">
        <Link href="/admin/account" className="font-medium text-amber-600 hover:underline">
          Account
        </Link>
      </p>
    </main>
  );
}
