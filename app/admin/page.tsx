import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { logout, retryDelivery } from "./actions";

export const metadata: Metadata = { title: "Admin · Orders" };
export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-950/60 text-yellow-300 border-yellow-800",
  processing: "bg-blue-950/60 text-blue-300 border-blue-800",
  delivered: "bg-green-950/60 text-green-300 border-green-800",
  failed: "bg-red-950/60 text-red-300 border-red-800",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${statusStyles[status] ?? "border-slate-700 bg-slate-900 text-slate-300"}`}
    >
      {status}
    </span>
  );
}

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { package: true, deliveries: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pt-14">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white">Orders</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/packages"
            className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-moon-500/60"
          >
            Edit packages
          </Link>
          <form action={logout}>
            <button className="rounded-lg border border-night-600 px-4 py-2 text-sm text-slate-400 hover:text-white">
              Log out
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {orders.length === 0 && (
          <p className="text-slate-500">No orders yet. They&apos;ll appear here after the first Stripe payment.</p>
        )}
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-night-600 bg-night-800/80 p-5 backdrop-blur"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-bold text-white">
                {order.package.name}
                {order.quantity > 1 && (
                  <span className="ml-1 text-moon-400">×{order.quantity}</span>
                )}
              </span>
              <span className="text-moon-400">
                {formatPrice(order.amountCents, order.currency)}
              </span>
              <span className="text-slate-300">
                {order.effectiveUsername}
                <span className="ml-1 text-xs text-slate-500">({order.platform})</span>
              </span>
              {order.email && <span className="text-slate-500">{order.email}</span>}
              <span className="ml-auto text-xs text-slate-500">
                {order.createdAt.toLocaleString("en-CA")}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {order.deliveries.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg bg-night-900/70 px-3 py-2 text-sm"
                >
                  <StatusBadge status={d.status} />
                  <code className="flex-1 break-all text-xs text-slate-300">{d.command}</code>
                  <span className="text-xs text-slate-500">
                    {d.attempts} attempt{d.attempts === 1 ? "" : "s"}
                  </span>
                  {d.lastError && (
                    <span className="w-full text-xs text-red-400">↳ {d.lastError}</span>
                  )}
                  {(d.status === "failed" || d.status === "processing") && (
                    <form action={retryDelivery}>
                      <input type="hidden" name="id" value={d.id} />
                      <button className="rounded bg-moon-500 px-3 py-1 text-xs font-bold text-night-950 hover:bg-moon-400">
                        Retry
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
