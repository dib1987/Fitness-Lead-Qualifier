import { redirect } from "next/navigation";
import Link from "next/link";
import { createSessionClient } from "@/lib/supabase";

// F8 — Shared admin shell: sidebar nav + sign-out. Gated by middleware.ts.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSessionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/sign-in");

  const navLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/leads", label: "Leads" },
  ];

  return (
    <div className="flex h-screen bg-stone-50">
      <aside className="flex w-56 flex-col border-r border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-5 py-4">
          <div className="text-sm font-semibold text-stone-900">Lead Engine</div>
          <div className="text-xs text-stone-500">Admin</div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-amber-50 hover:text-amber-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-stone-200 p-3">
          <form action="/api/auth/sign-out" method="post">
            <button
              type="submit"
              className="w-full rounded-lg bg-stone-200 px-3 py-2 text-sm font-semibold text-stone-900 transition hover:bg-stone-300"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
