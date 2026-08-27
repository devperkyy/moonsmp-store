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
      <h1 className="text-4xl font-extrabold tracking-tight text-white">Ranks</h1>
      <p className="mt-3 max-w-2xl text-slate-400">
        Permanent name tags for Java and Bedrock alike — just rank tags to support the server,
        only Moon+ &amp; Moon++ carry benefits. 20% off right now.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
