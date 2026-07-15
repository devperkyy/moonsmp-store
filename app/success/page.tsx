import type { Metadata } from "next";
import Link from "next/link";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Thank you!" };
export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  let username: string | null = null;
  let paid = false;

  if (searchParams.session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(searchParams.session_id);
      paid = session.payment_status === "paid";
      username = session.metadata?.username ?? null;
    } catch {
      // invalid/expired session id — show the generic message
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-24 text-center">
      <div className="mc-panel p-10">
        <div className="text-5xl">{paid ? "🌙" : "⏳"}</div>
        <h1 className="mc-text-shadow mt-4 font-pixel text-xl text-white">
          {paid ? "Thank you!" : "Almost there…"}
        </h1>
        <p className="mt-3 text-slate-300">
          {paid ? (
            <>
              Payment received{username ? ` for ${username}` : ""}. Your purchase is being
              delivered in-game — it usually lands within a minute. If you&apos;re online,
              you may need to relog to see rank changes.
            </>
          ) : (
            <>We haven&apos;t seen your payment confirmation yet. If you completed checkout, it can take a moment to process.</>
          )}
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Something wrong? Open a ticket in our Discord with your Minecraft username.
        </p>
        <Link href="/" className="mc-btn mc-btn-green mt-8">
          Back to the store
        </Link>
      </div>
    </div>
  );
}
