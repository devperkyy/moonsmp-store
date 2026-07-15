import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import PackageCard from "@/components/PackageCard";

export const metadata: Metadata = { title: "Ranks" };
export const dynamic = "force-dynamic";

export default async function RanksPage() {
  const packages = await prisma.package.findMany({
    where: { category: "ranks", active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pt-14">
      <h1 className="mc-text-shadow font-pixel text-2xl text-white">Ranks</h1>
      <p className="mt-2 max-w-2xl text-slate-400">
        Permanent server ranks. Perks apply on Java and Bedrock alike — just pick your
        edition at checkout.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>
      {packages.length === 0 && (
        <p className="mt-10 text-slate-500">No packages available right now — check back soon.</p>
      )}
    </div>
  );
}
