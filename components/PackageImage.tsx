"use client";

import { useImageOk } from "./Branding";

// Package art lives at /public/packages/<id>.png. Until a file is dropped
// in, a gradient tile with an icon renders instead.
const FALLBACK_ICONS: Record<string, string> = {
  star: "⭐",
  starstruck: "🌠",
  meteorite: "💫",
  "moon-plus": "🌙",
  asteroid: "☄️",
  "vote-key": "🗳️",
  "donator-key": "🔑",
};

export default function PackageImage({
  id,
  name,
  className = "",
  iconClassName = "text-6xl",
}: {
  id: string;
  name: string;
  className?: string;
  iconClassName?: string;
}) {
  const { ref, ok, fail } = useImageOk();
  if (!ok) {
    // MC dropped-item look: the icon bobs above a pulsing ground shadow,
    // grass strip along the bottom of the frame
    return (
      <div className={`mc-item-frame ${className}`}>
        <span className="mc-item-shadow" />
        <span className={`mc-item ${iconClassName}`}>{FALLBACK_ICONS[id] ?? "📦"}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={`/packages/${id}.png`}
      alt={name}
      className={`object-cover ${className}`}
      style={{ imageRendering: "pixelated" }}
      onError={fail}
    />
  );
}
