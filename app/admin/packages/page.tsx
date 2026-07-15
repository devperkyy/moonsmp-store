import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { updatePackage } from "../actions";

export const metadata: Metadata = { title: "Admin · Packages" };
export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const packages = await prisma.package.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="mx-auto max-w-4xl px-4 pt-14">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white">Packages</h1>
        <Link
          href="/admin"
          className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-moon-500/60"
        >
          ← Orders
        </Link>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Command templates run as console commands on delivery. One command per line —{" "}
        <code className="rounded bg-night-800 px-1">{"{username}"}</code> is replaced with the
        buyer&apos;s name (Bedrock players automatically get the Floodgate{" "}
        <code className="rounded bg-night-800 px-1">.</code> prefix).
      </p>

      <div className="mt-8 space-y-6">
        {packages.map((pkg) => (
          <form
            key={pkg.id}
            action={updatePackage}
            className="rounded-xl border border-night-600 bg-night-800/80 p-6 backdrop-blur"
          >
            <input type="hidden" name="id" value={pkg.id} />
            <div className="flex flex-wrap items-center gap-3">
              <code className="text-xs text-slate-500">{pkg.id}</code>
              <span className="rounded bg-night-700 px-2 py-0.5 text-xs text-slate-300">
                {pkg.category}
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-300">
                Name
                <input
                  name="name"
                  defaultValue={pkg.name}
                  className="mt-1 w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 text-white outline-none focus:border-moon-500"
                />
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="col-span-1 text-sm font-medium text-slate-300">
                  Price (CAD)
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={(pkg.priceCents / 100).toFixed(2)}
                    className="mt-1 w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 text-white outline-none focus:border-moon-500"
                  />
                </label>
                <label className="col-span-1 text-sm font-medium text-slate-300">
                  Sort
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={pkg.sortOrder}
                    className="mt-1 w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 text-white outline-none focus:border-moon-500"
                  />
                </label>
                <label className="col-span-1 flex items-end gap-2 pb-2 text-sm font-medium text-slate-300">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={pkg.active}
                    className="h-4 w-4 accent-moon-500"
                  />
                  Active
                </label>
              </div>
            </div>

            <label className="mt-4 block text-sm font-medium text-slate-300">
              Description
              <input
                name="description"
                defaultValue={pkg.description}
                className="mt-1 w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 text-white outline-none focus:border-moon-500"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-300">
              Command template
              <textarea
                name="commandTemplate"
                rows={2}
                defaultValue={pkg.commandTemplate}
                className="mt-1 w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-mono text-sm text-white outline-none focus:border-moon-500"
              />
            </label>

            <button className="mt-4 rounded-lg bg-moon-500 px-5 py-2 text-sm font-bold text-night-950 transition hover:bg-moon-400">
              Save
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
