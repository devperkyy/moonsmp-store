import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy" };

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. What we collect",
    body: [
      "The Minecraft username and edition (Java or Bedrock) you enter and confirm when you enter this website. It is stored in your browser for the length of your visit so your purchases can be delivered to the right player.",
      "When you buy something: the package, price, and quantity you bought, a Stripe payment reference, and the email address you give Stripe at checkout (used for your receipt and for support).",
      "Delivery records: the in-game command that ran for your purchase, whether it succeeded, and when. We keep these so we can fix a delivery that went wrong.",
    ],
  },
  {
    title: "2. How we use it",
    body: [
      "To deliver what you bought to your Minecraft account, to answer support tickets (for example “I paid but got nothing”), and to prevent fraud and abuse of the store.",
      "We do not sell your information, show you ads, or use it for anything unrelated to running the Moon SMP store.",
    ],
  },
  {
    title: "3. Cookies & local storage",
    body: [
      "Your entered username is kept in your browser's session storage and cleared when you close the browser — you re-enter it on your next visit.",
      "Cookies and similar storage are used to track activity on the website (such as pages visited and purchases started or completed) and to keep staff logged in to the admin panel.",
      "Stripe's checkout pages set their own cookies under Stripe's own privacy policy.",
    ],
  },
  {
    title: "4. Payments",
    body: [
      "All payments are processed by Stripe. Your card number never touches our servers and we cannot see it. See Stripe's privacy policy for how they handle payment data.",
    ],
  },
  {
    title: "5. Skin lookups",
    body: [
      "To show your player head on the site, the username you enter is sent to our server, which looks up your public skin through Mojang's API (Java) or the GeyserMC API (Bedrock). These lookups only involve information that is already public for every Minecraft account.",
    ],
  },
  {
    title: "6. Who we share it with",
    body: [
      "Only the services that run the store: Stripe (payments), our hosting provider, and our database provider. Nothing is shared with anyone else, and nothing is ever sold.",
    ],
  },
  {
    title: "7. How long we keep it",
    body: [
      "Order and delivery records are kept so we can handle support requests and keep basic accounting. If you want your data removed, open a ticket in the Moon SMP Discord and we will delete what we are not legally required to keep.",
    ],
  },
  {
    title: "8. Children",
    body: [
      "The store sells digital extras for a Minecraft server. If you are a minor, you must have the permission of the owner of the payment method (for example, a parent or guardian) before buying anything.",
    ],
  },
  {
    title: "9. Changes & contact",
    body: [
      "We may update this policy from time to time; the current version is always on this page. Questions? Open a ticket in the Moon SMP Discord server.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-14">
      <h1 className="mc-text-shadow font-pixel text-2xl text-white">
        Privacy <span className="text-moon-400">Policy</span>
      </h1>
      <p className="mt-3 text-sm text-slate-500">Last updated: July 15, 2026</p>

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

      <div className="mt-8 flex justify-center gap-3">
        <Link href="/terms" className="mc-btn">
          Terms of Service
        </Link>
        <Link href="/" className="mc-btn">
          Back to the store
        </Link>
      </div>
    </div>
  );
}
