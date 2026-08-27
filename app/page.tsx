import Link from "next/link";
import { Banner } from "@/components/Branding";

const categories = [
  {
    href: "/ranks",
    title: "Ranks",
    blurb: "Star, Starstruck, Moon+ and Asteroid — perks that last forever.",
  },
  {
    href: "/crates",
    title: "Crates & Keys",
    blurb: "Vote and Donator keys for the crates at spawn.",
  },
];

// Step 2's wording depends on which entry gate is live — with Discord
// sign-in the delivery target is the linked account, not a typed username.
// Same DISCORD_CLIENT_ID kill switch app/layout.tsx uses.
const steps = [
  { n: "1", title: "Pick a package", text: "Choose a rank or crate key from the store." },
  {
    n: "2",
    title: "Checkout with Stripe",
    text: process.env.DISCORD_CLIENT_ID
      ? "Pay securely — your purchase goes to the Minecraft account linked to your Discord."
      : "Pay securely — your purchase goes to the username you entered when you joined the site.",
  },
  {
    n: "3",
    title: "Delivered in-game",
    text: "Your purchase is applied automatically, usually within a minute.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* hero */}
      <section className="pt-16 text-center sm:pt-24">
        <Banner />
        <h1 className="mt-10 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
          Moon SMP <span className="bg-gradient-to-r from-moon-300 to-moon-500 bg-clip-text text-transparent">Store</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-slate-300">
          Support the server and get something shiny back. Every purchase is delivered
          in-game automatically — Java and Bedrock both welcome.
        </p>
      </section>

      {/* categories */}
      <section className="mt-16 grid gap-6 sm:grid-cols-2">
        {categories.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="mc-panel group p-8 transition duration-200 hover:-translate-y-1 hover:border-white/20"
          >
            <h2 className="text-xl font-bold text-white transition group-hover:text-moon-300">
              {c.title} <span className="transition group-hover:translate-x-1">→</span>
            </h2>
            <p className="mt-3 text-sm text-slate-400">{c.blurb}</p>
          </Link>
        ))}
      </section>

      {/* how it works */}
      <section className="mt-20">
        <h2 className="text-center text-sm font-bold uppercase tracking-widest text-slate-400">
          How it works
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="mc-panel p-6 text-center">
              <div className="mc-btn mc-btn-green mx-auto !px-4">{s.n}</div>
              <h3 className="mt-4 text-sm font-bold text-white">{s.title}</h3>
              <p className="mt-3 text-sm text-slate-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
