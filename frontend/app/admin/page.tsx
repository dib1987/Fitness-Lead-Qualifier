// F8 — Admin dashboard (gated by middleware.ts). Rebuild of admin/index.html.
// Reads via the session client so RLS scopes data to the admin's tenant.
export default function AdminDashboard() {
  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Dashboard</h1>
      <p>Leads, scores, email history, audit trail. TODO: render from /api/admin/*.</p>
    </main>
  );
}
