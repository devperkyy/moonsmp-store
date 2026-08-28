import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Admin · Audit log" };
export const dynamic = "force-dynamic";

const actionStyles: Record<string, string> = {
  login: "border-green-800 bg-green-950/60 text-green-300",
  login_failed: "border-red-800 bg-red-950/60 text-red-300",
  login_rate_limited: "border-red-800 bg-red-950/60 text-red-300",
  package_update: "border-blue-800 bg-blue-950/60 text-blue-300",
  maintenance_update: "border-amber-800 bg-amber-950/60 text-amber-300",
  delivery_retry: "border-slate-700 bg-slate-900 text-slate-300",
};

export default async function AdminAuditPage() {
  const entries = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 pt-14">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white">Audit log</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-moon-500/60"
          >
            ← Orders
          </Link>
          <Link
            href="/admin/maintenance"
            className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-moon-500/60"
          >
            Maintenance
          </Link>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Every admin login (successful, failed, or rate-limited), package edit, maintenance
        toggle, and delivery retry — most recent 200.
      </p>

      <div className="mt-8 space-y-2">
        {entries.length === 0 && (
          <p className="text-slate-500">Nothing logged yet.</p>
        )}
        {entries.map((e) => (
          <div
            key={e.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-night-600 bg-night-800/80 px-4 py-2.5 text-sm"
          >
            <span
              className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${actionStyles[e.action] ?? "border-slate-700 bg-slate-900 text-slate-300"}`}
            >
              {e.action}
            </span>
            {e.detail && <span className="text-slate-300">{e.detail}</span>}
            <span className="text-xs text-slate-500">{e.ip}</span>
            <span className="ml-auto text-xs text-slate-500">
              {e.createdAt.toLocaleString("en-CA")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
