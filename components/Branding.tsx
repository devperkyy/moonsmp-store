"use client";

import { useEffect, useRef, useState } from "react";

// Logo + banner render from /public/branding/. Until the files are dropped
// in, they fall back gracefully. The mount-time naturalWidth check matters:
// a 404 can happen before React hydrates, so onError alone can miss it.
export function useImageOk() {
  const ref = useRef<HTMLImageElement>(null);
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setOk(false);
  }, []);
  return { ref, ok, fail: () => setOk(false) };
}

export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  const { ref, ok, fail } = useImageOk();
  if (!ok) {
    return (
      <span className="mc-text-shadow font-pixel text-xs tracking-widest">
        <span className="text-slate-100">MOON</span>{" "}
        <span className="text-moon-500">SMP</span>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src="/branding/logo.png"
      alt="Moon SMP"
      className={className}
      style={{ imageRendering: "pixelated" }}
      onError={fail}
    />
  );
}

export function Banner() {
  const { ref, ok, fail } = useImageOk();
  if (!ok) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src="/branding/banner.png"
      alt="Moon SMP — a pixel village at night"
      className="mx-auto w-full max-w-3xl rounded-xl border border-night-600 shadow-2xl shadow-black/60"
      style={{ imageRendering: "pixelated" }}
      onError={fail}
    />
  );
}
