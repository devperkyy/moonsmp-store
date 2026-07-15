"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  OPEN_GATE_EVENT,
  getStoredUser,
  isValidUsername,
  setStoredUser,
  type StoredUser,
} from "@/lib/user-client";
import MinecraftHead from "./MinecraftHead";

// Full-screen entry gate: enter your Minecraft username → accept the ToS →
// confirm your skin head ("Is this you?") → scroll down → Continue.
// The confirmed username is the delivery target for every purchase.
export default function UsernameGate() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState<StoredUser["platform"]>("java");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [confirmedYes, setConfirmedYes] = useState(false);
  const [error, setError] = useState("");
  const continueRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The gate runs on EVERY full page load — a stored user only prefills the
    // form. Client-side navigation within the site doesn't remount this
    // component, so browsing pages never re-prompts mid-visit.
    const existing = getStoredUser();
    if (existing) {
      setUsername(existing.username);
      setPlatform(existing.platform);
    }
    setOpen(true);

    const reopen = () => {
      const existing = getStoredUser();
      if (existing) {
        setUsername(existing.username);
        setPlatform(existing.platform);
      }
      setStep("enter");
      setTosAccepted(false);
      setConfirmedYes(false);
      setError("");
      setOpen(true);
    };
    window.addEventListener(OPEN_GATE_EVENT, reopen);
    return () => window.removeEventListener(OPEN_GATE_EVENT, reopen);
  }, []);

  // /terms and /privacy must be readable before accepting; admin has its own
  // login; /success is the Stripe return page — the delivery username is
  // already locked into the order, so don't gate the "thank you" screen.
  const suppressed =
    pathname.startsWith("/terms") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/success");

  // lock the page behind the gate while it's open — but never on pages where
  // the gate itself is hidden, or they become unscrollable
  useEffect(() => {
    document.body.style.overflow = open && !suppressed ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, suppressed]);

  if (suppressed || !open) return null;

  function submitUsername() {
    if (!isValidUsername(username)) {
      setError("That doesn't look like a valid Minecraft username.");
      return;
    }
    setError("");
    setTosAccepted(false);
    setConfirmedYes(false);
    setStep("confirm");
  }

  function answerNo() {
    setStep("enter");
    setConfirmedYes(false);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function answerYes() {
    setConfirmedYes(true);
    // push the page down to the continue button
    setTimeout(
      () => continueRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
      50
    );
  }

  function finish() {
    if (!tosAccepted) {
      setError("You have to check the Terms of Service box first.");
      return;
    }
    setStoredUser({ username: username.trim(), platform });
    setOpen(false);
    window.scrollTo(0, 0);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-[#04060d] via-[#070b17] to-[#0d1526]">
      <div ref={topRef} className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        {/* step 1: username */}
        <div className="mc-panel p-8">
          <h1 className="mc-text-shadow font-pixel text-lg leading-relaxed text-white">
            MOON <span className="text-moon-400">SMP</span>
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Enter your Minecraft username to browse the store. Ranks and keys are
            delivered to this player.
          </p>

          <div className="mt-5 flex gap-2">
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

          <input
            className="mc-input mt-3"
            placeholder={platform === "bedrock" ? "Your gamertag" : "Your username"}
            value={username}
            maxLength={16}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitUsername()}
            disabled={step === "confirm"}
          />

          {step === "enter" && (
            <button
              type="button"
              onClick={submitUsername}
              disabled={!username.trim()}
              className="mc-btn mc-btn-green mt-4 w-full"
            >
              Okay
            </button>
          )}
          {error && step === "enter" && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}
        </div>

        {/* step 2: ToS + is this you? */}
        {step === "confirm" && (
          <div className="mc-panel mt-8 p-8">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-200">
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
            <p className="mt-3 text-xs text-slate-500">
              To read the Terms of Service, click the highlighted Terms of Service above.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              By clicking Yes you accept all of our Terms of Service and allow your
              cookies to be used to track activity on the website.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              See our{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-semibold text-moon-300 underline underline-offset-2 hover:text-moon-400"
              >
                Privacy Policy
              </Link>{" "}
              for how your data is used.
            </p>

            <div className="mt-6 flex items-center gap-4 border-2 border-black bg-night-900/80 p-4">
              <MinecraftHead
                username={username.trim()}
                platform={platform}
                size={64}
                className="border-2 border-black"
              />
              <div>
                <p className="mc-text-shadow font-pixel text-sm text-white">
                  {username.trim()}
                </p>
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
          </div>
        )}

        {/* step 3: continue into the site */}
        {confirmedYes && (
          <div ref={continueRef} className="mc-panel mt-24 p-8 text-center">
            <p className="text-sm text-slate-300">
              Everything you buy will be delivered in-game to{" "}
              <span className="font-pixel text-xs text-moon-300">{username.trim()}</span>
              {platform === "bedrock" ? " (Bedrock)" : ""}.
            </p>
            <button type="button" onClick={finish} className="mc-btn mc-btn-green mt-6 w-full">
              Continue
            </button>
            {!tosAccepted && (
              <p className="mt-3 text-xs text-amber-400">
                Check the Terms of Service box above to continue.
              </p>
            )}
            {error && !tosAccepted && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </div>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
}
