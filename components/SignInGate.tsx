"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Session } from "@/lib/session";
import LinkStep from "./LinkStep";
import MinecraftHead from "./MinecraftHead";

// Full-screen entry gate, replacing the old typed-username UsernameGate.
// {session, linkedPlayer, linkingConfigured} are fetched ONCE server-side in
// app/layout.tsx (a single cookie read + one live Turso lookup per request)
// and passed down here — this component only decides which step to render
// and handles the interactive bits (pathname suppression, scroll lock,
// onboarding form). It renders nothing once sign-in + linking + onboarding
// are all complete.
export default function SignInGate({
  session,
  linkedPlayer,
  linkingConfigured,
}: {
  session: Session | null;
  linkedPlayer: string | null;
  linkingConfigured: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [platform, setPlatform] = useState<"java" | "bedrock">("java");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [confirmedYes, setConfirmedYes] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const continueRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Same suppressed-route policy as the old gate: legal pages must be
  // readable before accepting them, admin has its own login, and /success is
  // the Stripe return page — identity is already locked into the order by
  // the time a buyer lands there.
  const suppressed =
    pathname.startsWith("/terms") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/success");

  const needsOnboarding = Boolean(session) && Boolean(linkedPlayer) && !session?.tosAcceptedAt;
  const open = !suppressed && (!session || !linkedPlayer || needsOnboarding);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  function answerNo() {
    setConfirmedYes(false);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function answerYes() {
    setConfirmedYes(true);
    setTimeout(
      () => continueRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
      50
    );
  }

  async function finish() {
    if (!tosAccepted) {
      setError("You have to check the Terms of Service box first.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (!res.ok) throw new Error();
      window.scrollTo(0, 0);
      router.refresh();
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      ref={topRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-[#04060d] via-[#070b17] to-[#0d1526]"
    >
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        {/* step 1: sign in with Discord */}
        {!session && (
          <div className="mc-panel p-8">
            <h1 className="mc-text-shadow font-pixel text-lg leading-relaxed text-white">
              MOON <span className="text-moon-400">SMP</span>
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Sign in with Discord to browse the store. Ranks and keys are delivered to your
              linked Minecraft account.
            </p>
            <Link
              href={`/api/auth/login?next=${encodeURIComponent(pathname)}`}
              className="mc-btn mc-btn-green mt-5 flex w-full items-center justify-center gap-2"
            >
              Sign in with Discord
            </Link>
          </div>
        )}

        {/* step 2: link Discord to a Minecraft account */}
        {session && !linkedPlayer && (
          <LinkStep configured={linkingConfigured} mcHost={process.env.NEXT_PUBLIC_MC_HOST ?? "MoonSMP.org"} />
        )}

        {/* step 3: platform + skin confirm + ToS */}
        {session && linkedPlayer && needsOnboarding && (
          <div className="mc-panel mt-8 p-8">
            <p className="mc-text-shadow mb-3 font-pixel text-[11px] text-white">
              One last step
            </p>

            <div className="mt-2 flex gap-2">
              {(["java", "bedrock"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`mc-btn flex-1 ${platform === p ? "mc-btn-green" : ""}`}
                >
                  {p === "java" ? "Java" : "Bedrock"}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4 border-2 border-black bg-night-900/80 p-4">
              <MinecraftHead username={linkedPlayer} platform={platform} size={64} className="border-2 border-black" />
              <div>
                <p className="mc-text-shadow font-pixel text-sm text-white">{linkedPlayer}</p>
                <p className="mt-1 text-sm text-slate-400">Is this you?</p>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button type="button" onClick={answerYes} className="mc-btn mc-btn-green flex-1">
                Yes
              </button>
              <button type="button" onClick={answerNo} className="mc-btn mc-btn-red flex-1">
                No
              </button>
            </div>
            {!confirmedYes && (
              <p className="mt-2 text-xs text-slate-500">
                Wrong account? Ask a staff member to run <code className="text-moon-300">/link remove</code> in
                Discord, then link again.
              </p>
            )}

            <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 accent-moon-500"
              />
              <span>
                I accept the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-semibold text-moon-300 underline underline-offset-2 hover:text-moon-400"
                >
                  Terms of Service
                </Link>
              </span>
            </label>
            <p className="mt-1 text-xs text-slate-500">
              By continuing you accept all of our Terms of Service. See our{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-semibold text-moon-300 underline underline-offset-2 hover:text-moon-400"
              >
                Privacy Policy
              </Link>{" "}
              for how your data is used.
            </p>

            {confirmedYes && (
              <div ref={continueRef} className="mt-6 text-center">
                <p className="text-sm text-slate-300">
                  Everything you buy will be delivered in-game to{" "}
                  <span className="font-pixel text-xs text-moon-300">{linkedPlayer}</span>
                  {platform === "bedrock" ? " (Bedrock)" : ""}.
                </p>
                <button
                  type="button"
                  onClick={finish}
                  disabled={submitting}
                  className="mc-btn mc-btn-green mt-4 w-full"
                >
                  {submitting ? "..." : "Continue"}
                </button>
              </div>
            )}
            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
          </div>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
}
