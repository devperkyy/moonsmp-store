"use client";

import { CSSProperties, useEffect, useState } from "react";

// Renders a player's head by CSS-cropping their raw skin texture:
// base face lives at (8,8,8,8) and the hat overlay at (40,8,8,8) on the
// 64px-wide skin. Works for both classic 64x64 and legacy 64x32 skins.
// While resolving (or if the player has no skin), a CSS Steve face shows.

function SteveFace({ size, className = "" }: { size: number; className?: string }) {
  const p = size / 8;
  return (
    <span
      className={className}
      aria-hidden
      style={{
        width: size,
        height: size,
        display: "inline-block",
        flexShrink: 0,
        position: "relative",
        background: "#c48d63",
        overflow: "hidden",
      }}
    >
      <span style={{ position: "absolute", inset: 0, height: p * 2, background: "#4a3120" }} />
      <span
        style={{
          position: "absolute",
          top: p * 4,
          left: p,
          width: p,
          height: p,
          background: "#fff",
          boxShadow: `${p}px 0 0 #523d8f, ${p * 4}px 0 0 #523d8f, ${p * 5}px 0 0 #fff`,
        }}
      />
      <span
        style={{
          position: "absolute",
          top: p * 5,
          left: p * 3,
          width: p * 2,
          height: p,
          background: "#8a5a3b",
        }}
      />
    </span>
  );
}

export default function MinecraftHead({
  username,
  platform,
  size = 64,
  className = "",
}: {
  username: string;
  platform: "java" | "bedrock";
  size?: number;
  className?: string;
}) {
  const [skinUrl, setSkinUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const name = username.trim();
    if (!name) return;
    const cacheKey = `mcskin:${platform}:${name.toLowerCase()}`;

    const cached = sessionStorage.getItem(cacheKey);
    if (cached !== null) {
      setSkinUrl(cached === "" ? null : cached);
      return;
    }

    fetch(`/api/avatar?username=${encodeURIComponent(name)}&platform=${platform}`)
      .then((res) => (res.ok ? res.json() : { skinUrl: null }))
      .then((data) => {
        if (!alive) return;
        sessionStorage.setItem(cacheKey, data.skinUrl ?? "");
        setSkinUrl(data.skinUrl ?? null);
      })
      .catch(() => alive && setSkinUrl(null));

    return () => {
      alive = false;
    };
  }, [username, platform]);

  if (!skinUrl) return <SteveFace size={size} className={className} />;

  const s = size / 8; // one skin pixel on screen
  const style: CSSProperties = {
    width: size,
    height: size,
    display: "inline-block",
    flexShrink: 0,
    imageRendering: "pixelated",
    // hat overlay layer on top of the base face layer
    backgroundImage: `url(${skinUrl}), url(${skinUrl})`,
    backgroundSize: `${64 * s}px auto, ${64 * s}px auto`,
    backgroundPosition: `${-40 * s}px ${-8 * s}px, ${-8 * s}px ${-8 * s}px`,
    backgroundRepeat: "no-repeat, no-repeat",
  };
  return <span className={className} style={style} aria-hidden />;
}
