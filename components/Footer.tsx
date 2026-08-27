import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-night-950/50 pb-4 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-500">
        <p className="mb-2 text-sm font-bold tracking-wide text-slate-300">Moon SMP</p>
        <p>
          Purchases support server hosting and development. Deliveries are automatic —
          usually within a minute.
        </p>
        <p className="mt-2">
          Not affiliated with Mojang Studios or Microsoft. Payments processed securely by Stripe.
        </p>
        <p className="mt-3 space-x-4">
          <Link href="/terms" className="text-moon-300 underline underline-offset-2 hover:text-moon-400">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-moon-300 underline underline-offset-2 hover:text-moon-400">
            Privacy Policy
          </Link>
        </p>
      </div>
    </footer>
  );
}
