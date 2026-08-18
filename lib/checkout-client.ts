import { getStoredUser, openGate } from "@/lib/user-client";

// Shared by PurchasePanel and BuyButton. Deliberately mode-agnostic — it
// doesn't need to know whether Discord sign-in or the legacy typed-username
// gate is active server-side; it reacts to whichever error code the server
// sends back:
//   - legacy mode's checkout branch returns 400 "Invalid Minecraft username"
//     when nothing is in sessionStorage yet → reopen the old gate.
//   - Discord mode's branch returns 401 "auth_required" when there's no
//     session at all, 403 "not_linked"/"onboarding_incomplete" when signed
//     in but the gate isn't fully satisfied yet, 503 "linking_unavailable"
//     if Turso is down.
// A legacy stored user (if present) is still forwarded for backward
// compatibility; Discord-mode's checkout route ignores it entirely.
export async function startCheckout(packageId: string, quantity: number): Promise<void> {
  const legacyUser = getStoredUser();

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      packageId,
      quantity,
      ...(legacyUser ? { username: legacyUser.username, platform: legacyUser.platform } : {}),
    }),
  });

  if (res.ok) {
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    throw new Error("Checkout succeeded but returned no URL");
  }

  const data = await res.json().catch(() => ({ error: null }));
  switch (data.error) {
    case "auth_required":
      window.location.href = `/api/auth/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    case "not_linked":
    case "onboarding_incomplete":
      // The gate is server-rendered from session/link state — reloading
      // re-evaluates it and shows the right step.
      window.location.reload();
      return;
    case "linking_unavailable":
      alert("Account linking is temporarily unavailable — try again in a moment.");
      return;
    case "Invalid Minecraft username":
      // Legacy mode, nothing (valid) in sessionStorage yet.
      openGate();
      return;
    default:
      alert("Could not start checkout — please try again.");
  }
}
