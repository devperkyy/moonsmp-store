"use client";

import { useState } from "react";
import { compareAtCents, formatPrice, QUANTITY_OPTIONS } from "@/lib/format";
import { startCheckout } from "@/lib/checkout-client";

export default function PurchasePanel({
  packageId,
  priceCents,
  currency,
  createdAt,
  bought,
  allowQuantity,
  salePercent,
}: {
  packageId: string;
  priceCents: number;
  currency: string;
  createdAt: string; // pre-formatted server-side
  bought: number;
  allowQuantity: boolean; // crates only — ranks are one-time purchases
  salePercent: number | null; // shows a struck-through "was" price + badge when set
}) {
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  async function buy() {
    setLoading(true);
    try {
      await startCheckout(packageId, quantity);
    } catch (err) {
      console.error(err);
      alert("Could not start checkout — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mc-panel h-fit p-6">
      {/* bold price, updates with quantity */}
      <div className="text-3xl font-extrabold tracking-tight text-white">
        {formatPrice(priceCents * quantity, currency)}
        <span className="ml-2 text-xs font-medium text-slate-500">CAD</span>
      </div>
      {salePercent !== null && (
        <div className="mt-2 flex items-center gap-2">
          <s className="text-sm text-slate-500">
            {formatPrice(compareAtCents(priceCents, salePercent), currency)}
          </s>
          <span className="mc-sale-badge">-{salePercent}%</span>
        </div>
      )}

      <dl className="mt-5 space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Created</dt>
          <dd className="text-slate-300">{createdAt}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Bought</dt>
          <dd className="text-slate-300">
            {bought} time{bought === 1 ? "" : "s"}
          </dd>
        </div>
      </dl>

      {allowQuantity ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Package</p>
          <div className="mt-2 space-y-2">
            {QUANTITY_OPTIONS.map((q) => (
              <button
                key={q}
                onClick={() => setQuantity(q)}
                className={`mc-btn w-full justify-between ${quantity === q ? "mc-btn-green" : ""}`}
              >
                <span>{q}x</span>
                <span>{formatPrice(priceCents * q, currency)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-400">
          Ranks are a one-time purchase — yours forever.
        </p>
      )}

      <button
        onClick={buy}
        disabled={loading}
        className="mc-btn mc-btn-green mt-6 w-full"
      >
        {loading ? "..." : allowQuantity ? `Buy ${quantity}x` : "Buy"}
      </button>
    </div>
  );
}
