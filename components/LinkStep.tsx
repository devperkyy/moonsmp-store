"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Issued = { code: string; expiresAt: number; command: string };

// Get-code + poll UI, ported from moonsmp-support's LinkPanel.tsx. SignInGate
// only renders this step while the buyer isn't linked yet, so there's no
// "already linked" branch here — a successful poll just refreshes the page,
// and the server-side gate re-evaluates from there.
export default function LinkStep({ configured, mcHost }: { configured: boolean; mcHost: string }) {
  const router = useRouter();
  const [issued, setIssued] = useState<Issued | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestCode = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/link", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.error === "linking_unavailable"
            ? "Account linking is offline right now. Run /link start in Discord instead."
            : json.error === "already_linked"
              ? "You're already linked — refreshing…"
              : "Couldn't generate a code. Try again in a moment."
        );
        if (json.error === "already_linked") router.refresh();
        return;
      }
      setIssued(json as Issued);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }, [router]);

  // Poll while a code is outstanding — the bot completes the link from the
  // Minecraft console, so the only way we learn about it is by asking.
  useEffect(() => {
    if (!issued) return;
    pollRef.current = setInterval(async () => {
      setNow(Date.now());
      try {
        const res = await fetch("/api/link", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (json.link?.player) {
          setIssued(null);
          router.refresh();
        }
      } catch {
        /* transient — keep polling */
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [issued, router]);

  const secondsLeft = issued ? Math.max(0, Math.floor((issued.expiresAt - now) / 1000)) : 0;
  const expired = Boolean(issued) && secondsLeft === 0;

  return (
    <div className="mc-panel mt-8 p-8">
      <p className="mc-text-shadow mb-3 font-pixel text-[11px] text-white">
        Link your Minecraft account
      </p>
      <p className="mb-5 text-sm leading-relaxed text-slate-400">
        We need to know who you are in-game before you can buy anything. It takes about
        fifteen seconds.
      </p>

      {!configured && (
        <p className="mb-5 border-2 border-black bg-night-800 p-3 text-xs text-amber-300">
          Web linking is temporarily unavailable. Run <code>/link start</code> in the MoonSMP
          Discord instead — it does exactly the same thing, then come back and refresh.
        </p>
      )}

      {!issued && configured && (
        <button type="button" className="mc-btn mc-btn-green" onClick={requestCode} disabled={busy}>
          {busy ? "Generating…" : "Get my link code"}
        </button>
      )}

      {issued && (
        <div>
          <ol className="mb-5 space-y-3 text-sm text-slate-300">
            <li>
              <span className="text-slate-500">1.</span> Join <code className="text-moon-300">{mcHost}</code>
            </li>
            <li>
              <span className="text-slate-500">2.</span> Run this command in chat:
            </li>
          </ol>

          <div className="mb-4 border-2 border-black bg-night-950 p-4 text-center">
            <p className="mc-text-shadow select-all font-pixel text-[16px] tracking-widest text-emerald-300">
              {issued.command}
            </p>
          </div>

          {expired ? (
            <div>
              <p className="mb-3 text-xs text-amber-300">That code expired.</p>
              <button type="button" className="mc-btn" onClick={requestCode} disabled={busy}>
                Get a new code
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Waiting for you in-game… expires in {Math.floor(secondsLeft / 60)}:
              {String(secondsLeft % 60).padStart(2, "0")}
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

      <p className="mt-6 border-t-2 border-night-700 pt-4 text-xs text-slate-500">
        Prefer Discord? <code className="text-moon-300">/link start</code> in the MoonSMP server
        works too.
      </p>
    </div>
  );
}
