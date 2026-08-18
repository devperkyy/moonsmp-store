"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { StoreSession } from "@/lib/session";
import LinkStep from "./LinkStep";
import MinecraftHead from "./MinecraftHead";

export default function SignInGate({
  session,
  linkedPlayer,
}: {
  session: StoreSession | null;
  linkedPlayer: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [platform, setPlatform] = useState<"java" | "bedrock">(session?.platform ?? "java");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const suppressed = ["/terms", "/privacy", "/admin", "/success", "/api/auth"].some((path) =>
    pathname.startsWith(path),
  );
  const complete = Boolean(session && linkedPlayer && session.platform && session.tosAcceptedAt);
  const visible = !suppressed && !complete;

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  async function finish() {
    if (!accepted) {
      setError("Accept the Terms of Service and Privacy Policy first.");
      return;
    }
    setBusy(true);
    const response = await fetch("/api/auth/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, acceptedTerms: true }),
    });
    if (!response.ok) {
      setError("Could not finish sign-in. Please try again.");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto bg-gradient-to-b from-night-900 via-night-800 to-night-900 p-4">
      {!session ? (
        <div className="mc-panel w-full max-w-xl p-7 text-center">
          <p className="mc-text-shadow font-pixel text-xl text-white">MOON SMP STORE</p>
          <p className="mt-5 text-sm leading-relaxed text-slate-300">
            Sign in with Discord to verify your identity before entering the store.
          </p>
          <a href={`/api/auth/login?next=${encodeURIComponent(pathname)}`} className="mc-btn mc-btn-green mt-7 w-full">
            Sign in with Discord
          </a>
          <p className="mt-5 text-xs text-slate-500">We request your Discord identity and email only.</p>
        </div>
      ) : !linkedPlayer ? (
        <LinkStep />
      ) : (
        <div className="mc-panel w-full max-w-xl p-7 text-center">
          <p className="mc-text-shadow font-pixel text-sm text-emerald-300">ACCOUNT VERIFIED</p>
          <div className="mt-5 flex items-center justify-center gap-4">
            <MinecraftHead username={linkedPlayer} platform={platform} size={64} />
            <div className="text-left">
              <p className="font-pixel text-sm text-white">{linkedPlayer}</p>
              <p className="mt-2 text-xs text-slate-400">Signed in as {session.discordUsername}</p>
            </div>
          </div>
          <p className="mt-6 text-xs text-slate-400">Which edition do you play?</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {(["java", "bedrock"] as const).map((edition) => (
              <button
                key={edition}
                onClick={() => setPlatform(edition)}
                className={`mc-btn ${platform === edition ? "mc-btn-green" : ""}`}
              >
                {edition === "java" ? "Java" : "Bedrock"}
              </button>
            ))}
          </div>
          <label className="mt-6 flex items-start gap-3 text-left text-xs leading-relaxed text-slate-300">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
            <span>
              I accept the <Link className="text-moon-300 underline" href="/terms" target="_blank">Terms of Service</Link>{" "}
              and <Link className="text-moon-300 underline" href="/privacy" target="_blank">Privacy Policy</Link>.
            </span>
          </label>
          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
          <button onClick={finish} disabled={busy} className="mc-btn mc-btn-green mt-6 w-full">
            {busy ? "..." : "Enter store"}
          </button>
        </div>
      )}
    </div>
  );
}
