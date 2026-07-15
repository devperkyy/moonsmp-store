import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service" };

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. Who we are",
    body: [
      "This store is operated by the Moon SMP Minecraft server team. We sell digital in-game perks (ranks, crate keys, and similar items) for the Moon SMP server. We are not affiliated with, endorsed by, or associated with Mojang Studios or Microsoft in any way.",
    ],
  },
  {
    title: "2. Digital goods & delivery",
    body: [
      "Everything sold here is a digital item delivered inside the Moon SMP Minecraft server. Nothing physical is shipped.",
      "Purchases are delivered automatically to the Minecraft username you entered and confirmed when you entered this website. It is your responsibility to make sure that username is correct and matches the account (Java or Bedrock) that you actually play on. Items delivered to a username you entered incorrectly cannot be recovered.",
      "Delivery normally completes within a few minutes of payment. If the server is offline or restarting, your purchase is queued and delivered automatically as soon as the server is back. If you have not received a purchase within 24 hours, open a ticket in our Discord and we will look at the delivery log for your order.",
    ],
  },
  {
    title: "3. Payments & pricing",
    body: [
      "All payments are processed securely by Stripe. We never see or store your card details.",
      "Prices are listed in Canadian dollars (CAD). Prices, package contents, and perks may change at any time without notice; the price shown at checkout is the price you pay.",
      "You must be the owner of the payment method used, or have the owner's permission (for example, a parent or guardian). By purchasing, you confirm this.",
    ],
  },
  {
    title: "4. Refunds & chargebacks",
    body: [
      "Because everything sold here is a digital item delivered immediately, all sales are final and non-refundable, except where a refund is required by law.",
      "If something went wrong with a delivery, contact us in Discord first — we can re-run failed deliveries and we want to make it right.",
      "Opening a chargeback or payment dispute without contacting us first may result in a permanent ban of the associated Minecraft account from Moon SMP.",
    ],
  },
  {
    title: "5. Server rules still apply",
    body: [
      "Buying a rank or any other package does not exempt you from the server rules. If your account is banned or punished for breaking the rules, you are not entitled to a refund for any purchases, and perks are not transferable to another account.",
      "Perks apply on the Moon SMP server only and may be adjusted, rebalanced, or reworked over time to keep the server fair and fun.",
    ],
  },
  {
    title: "6. Cookies & tracking",
    body: [
      "By accepting these terms you allow this website to store your entered Minecraft username on your device and to use cookies and similar local storage to remember who you are and to track activity on the website (such as pages visited and purchases started or completed). This is used to deliver your purchases to the right player and to improve the store.",
      "Payment pages are hosted by Stripe, which sets its own cookies under its own privacy policy.",
    ],
  },
  {
    title: "7. Changes to these terms",
    body: [
      "We may update these terms from time to time. The current version is always available on this page. Continuing to use the store after a change means you accept the updated terms.",
    ],
  },
  {
    title: "8. Contact",
    body: [
      "For any question about a purchase, a delivery, or these terms, open a ticket in the Moon SMP Discord server.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-14">
      <h1 className="mc-text-shadow font-pixel text-2xl text-white">
        Terms of <span className="text-moon-400">Service</span>
      </h1>
      <p className="mt-3 text-sm text-slate-500">Last updated: July 14, 2026</p>

      <div className="mc-panel mt-8 space-y-8 p-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="mc-text-shadow font-pixel text-sm text-moon-300">{s.title}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-3 text-sm leading-relaxed text-slate-300">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="mc-btn">
          Back to the store
        </Link>
      </div>
    </div>
  );
}
