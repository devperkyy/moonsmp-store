"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type IssuedCode = { code: string; expiresAt: number; command: string };

export default function LinkStep() {
  const router = useRouter();
  const [issued, setIssued] = useState<IssuedCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  async function issueCode() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/link", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setIssued(data as IssuedCode);
    } catch {
      setError("Account linking is unavailable right now. Try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!issued) return;
    const timer = window.setInterval(async () => {
      setNow(Date.now());
      try {
        const response = await fetch("/api/link", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (data.link?.player) router.refresh();
      } catch {
        // Temporary network issue: keep polling until the code expires.
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [issued, router]);

  const secondsLeft = issued ? Math.max(0, Math.floor((issued.expiresAt - now) / 1000)) : 0;

  return (
    <div className="mc-panel w-full max-w-xl p-8 text-center">
      <p className="text-base font-extrabold tracking-tight text-white">Link Minecraft</p>
      <p className="mt-4 text-sm leading-relaxed text-slate-300">
        Your Discord must be linked before purchasing so ranks and keys reach the account you own.
      </p>
      {!issued || secondsLeft === 0 ? (
        <button className="mc-btn mc-btn-green mt-6 w-full" disabled={busy} onClick={issueCode}>
          {busy ? "..." : issued ? "Generate a new code" : "Get link code"}
        </button>
      ) : (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/25 p-5">
          <p className="text-xs text-slate-400">Join the server, then run:</p>
          <code className="mt-3 block font-mono text-lg font-semibold text-moon-300">
            {issued.command}
          </code>
          <p className="mt-3 text-xs text-slate-500">Expires in {secondsLeft}s — checking automatically.</p>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      <form action="/api/auth/logout" method="post" className="mt-5">
        <button className="text-xs text-slate-500 underline hover:text-white">Use another Discord account</button>
      </form>
    </div>
  );
}
