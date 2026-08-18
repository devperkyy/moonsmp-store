"use client";

import { useState } from "react";
import { startCheckout } from "@/lib/checkout-client";

export default function BuyButton({ packageId }: { packageId: string }) {
  const [loading, setLoading] = useState(false);

  async function buy() {
    setLoading(true);
    try {
      await startCheckout(packageId, 1);
    } catch (err) {
      console.error(err);
      alert("Could not start checkout — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={buy} disabled={loading} className="mc-btn mc-btn-green">
      {loading ? "..." : "Buy"}
    </button>
  );
}
