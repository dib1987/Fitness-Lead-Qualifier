import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase";

// F8 — Account details for the signed-in admin (gated by middleware.ts).
export default async function AccountPage() {
  const supabase = await createSessionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/sign-in");

  const { data: memberships } = await supabase
    .from("admin_users")
    .select("role, tenants ( name, slug )");

  return (
    <main style={{ padding: 40 }}>
      <h1 className="text-xl font-semibold text-stone-900">Account</h1>

      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="font-medium text-stone-700">Email</dt>
          <dd className="text-stone-600">{user.email}</dd>
        </div>
        <div>
          <dt className="font-medium text-stone-700">User ID</dt>
          <dd className="text-stone-600">{user.id}</dd>
        </div>
        <div>
          <dt className="font-medium text-stone-700">Created</dt>
          <dd className="text-stone-600">{new Date(user.created_at).toLocaleString()}</dd>
        </div>
      </dl>

      <h2 className="mt-6 text-sm font-medium text-stone-700">Tenants</h2>
      {memberships && memberships.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-stone-600">
          {memberships.map((m: any, i: number) => (
            <li key={i}>
              {m.tenants?.name} ({m.tenants?.slug}) — {m.role}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-stone-600">
          No tenants assigned yet. Ask an existing admin to add you to a tenant.
        </p>
      )}

      <form action="/api/auth/sign-out" method="post" className="mt-6">
        <button
          type="submit"
          className="rounded-lg bg-stone-200 px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-stone-300"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
