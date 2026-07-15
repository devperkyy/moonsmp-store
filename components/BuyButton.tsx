"use client";

import { useState } from "react";
import { getStoredUser, openGate } from "@/lib/user-client";

export default function BuyButton({ packageId }: { packageId: string }) {
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
          quantity: 1,
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
    <button onClick={buy} disabled={loading} className="mc-btn mc-btn-green">
      {loading ? "..." : "Buy"}
    </button>
  );
}
