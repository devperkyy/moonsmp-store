"use client";

// Full-page background photo with a subtle parallax drift toward the
// cursor. Same rAF-lerp pattern as XpBar/DayNightScroll elsewhere in this
// app — current eases toward target every frame instead of snapping
// straight to the mouse. The image layer is oversized (-inset-10 + scale)
// so the small translate never reveals an edge; .night-scene itself clips
// anything left over.
import { useEffect, useRef } from "react";

export default function NightBackground() {
  const imgRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      curX = lerp(curX, targetX, 0.06);
      curY = lerp(curY, targetY, 0.06);
      el.style.transform = `translate3d(${curX}px, ${curY}px, 0) scale(1.08)`;
      raf.current = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      // normalize to -1..1 from viewport center, then scale down to a
      // small pixel range so it reads as a nudge, not a slide
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetX = -nx * 18;
      targetY = -ny * 12;
    };

    raf.current = requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMove);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className="night-scene" aria-hidden="true">
      <div
        ref={imgRef}
        className="absolute -inset-10 bg-cover bg-center"
        style={{ backgroundImage: "url(/background/moon-river-night.png)" }}
      />
      {/* darkening overlay so cards/text stay readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/35" />
    </div>
  );
}
