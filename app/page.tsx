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

const steps = [
  { n: "1", title: "Pick a package", text: "Choose a rank or crate key from the store." },
  {
    n: "2",
    title: "Checkout with Stripe",
    text: "Pay securely — your purchase goes to the username you entered when you joined the site.",
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
        <h1 className="mc-text-shadow mt-10 font-pixel text-2xl leading-relaxed text-white sm:text-4xl">
          MOON SMP <span className="text-moon-400">STORE</span>
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
            className="mc-panel group p-8 transition hover:-translate-y-0.5"
          >
            <h2 className="mc-text-shadow font-pixel text-base text-white group-hover:text-moon-300">
              {c.title} →
            </h2>
            <p className="mt-3 text-sm text-slate-400">{c.blurb}</p>
          </Link>
        ))}
      </section>

      {/* how it works */}
      <section className="mt-20">
        <h2 className="mc-text-shadow text-center font-pixel text-sm text-slate-200">
          How it works
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="mc-panel p-6 text-center">
              <div className="mc-btn mc-btn-green mx-auto !px-4">{s.n}</div>
              <h3 className="mc-text-shadow mt-4 font-pixel text-xs text-white">{s.title}</h3>
              <p className="mt-3 text-sm text-slate-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
