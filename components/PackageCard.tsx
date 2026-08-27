import Link from "next/link";
import type { Package } from "@prisma/client";
import BuyButton from "./BuyButton";
import PackageImage from "./PackageImage";
import { compareAtCents, formatPrice, salePercentFor } from "@/lib/format";

export default function PackageCard({ pkg }: { pkg: Package }) {
  const salePercent = salePercentFor(pkg.category);
  return (
    <div className="mc-panel flex flex-col p-5 transition duration-200 hover:-translate-y-1 hover:border-white/20">
      <Link href={`/package/${pkg.id}`} className="group block">
        <PackageImage
          id={pkg.id}
          name={pkg.name}
          className="h-32 w-full rounded-lg"
          iconClassName="text-5xl"
        />
        <h3 className="mt-4 text-base font-bold text-white transition group-hover:text-moon-300">
          {pkg.name}
        </h3>
      </Link>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{pkg.description}</p>
      <div className="mt-6 flex items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-extrabold text-white">
            {formatPrice(pkg.priceCents, pkg.currency)}
          </span>
          {salePercent !== null && (
            <>
              <s className="text-xs text-slate-500">
                {formatPrice(compareAtCents(pkg.priceCents, salePercent), pkg.currency)}
              </s>
              <span className="mc-sale-badge">-{salePercent}%</span>
            </>
          )}
        </span>
        <BuyButton packageId={pkg.id} />
      </div>
    </div>
  );
}
