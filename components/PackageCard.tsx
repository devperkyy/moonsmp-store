import Link from "next/link";
import type { Package } from "@prisma/client";
import BuyButton from "./BuyButton";
import PackageImage from "./PackageImage";
import { formatPrice } from "@/lib/format";

export default function PackageCard({ pkg }: { pkg: Package }) {
  return (
    <div className="mc-panel flex flex-col p-5 transition hover:-translate-y-0.5">
      <Link href={`/package/${pkg.id}`} className="group block">
        <PackageImage
          id={pkg.id}
          name={pkg.name}
          className="h-32 w-full border-2 border-black"
          iconClassName="text-5xl"
        />
        <h3 className="mc-text-shadow mt-4 font-pixel text-sm text-white group-hover:text-moon-300">
          {pkg.name}
        </h3>
      </Link>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{pkg.description}</p>
      <div className="mt-6 flex items-center justify-between gap-2">
        <span className="mc-text-shadow font-pixel text-sm text-moon-400">
          {formatPrice(pkg.priceCents, pkg.currency)}
        </span>
        <BuyButton packageId={pkg.id} />
      </div>
    </div>
  );
}
