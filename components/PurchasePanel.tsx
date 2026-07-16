"use client";

import { useState } from "react";
import { RANK_SALE_PERCENT, compareAtCents, formatPrice, QUANTITY_OPTIONS } from "@/lib/format";
import { getStoredUser, openGate } from "@/lib/user-client";

export default function PurchasePanel({
  packageId,
  priceCents,
  currency,
  createdAt,
  bought,
  allowQuantity,
  showSale,
}: {
  packageId: string;
  priceCents: number;
  currency: string;
  createdAt: string; // pre-formatted server-side
  bought: number;
  allowQuantity: boolean; // crates only — ranks are one-time purchases
  showSale?: boolean; // ranks show a struck-through "was" price + -20% badge
}) {
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  async function buy() {
    const user = getStoredUser();
    if (!user) {
      openGate();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          quantity,
          username: user.username,
          platform: user.platform,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Could not start checkout — please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mc-panel h-fit p-6">
      {/* bold price, updates with quantity */}
      <div className="mc-text-shadow font-pixel text-3xl text-white">
        {formatPrice(priceCents * quantity, currency)}
        <span className="ml-2 text-xs text-slate-500">CAD</span>
      </div>
      {showSale && (
        <div className="mt-2 flex items-center gap-2">
          <s className="text-sm text-slate-500">
            {formatPrice(compareAtCents(priceCents), currency)}
          </s>
          <span className="mc-sale-badge">-{RANK_SALE_PERCENT}%</span>
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
          <p className="mc-text-shadow font-pixel text-[10px] text-slate-300">Package</p>
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
        <p className="mt-6 border-2 border-black bg-night-900/70 p-3 text-xs text-slate-400">
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
