"use client";

import { useEffect, useRef } from "react";

// Minecraft XP bar as a scroll progress indicator: empty at the top of the
// page, full at the bottom, eased with a rAF lerp so it glides both ways.
export default function XpBar() {
  const fillRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let target = 0;
    let current = 0;
    let raf = 0;
    let running = false;

    const paint = () => {
      if (fillRef.current) fillRef.current.style.width = `${current * 100}%`;
      if (levelRef.current) {
        levelRef.current.textContent = String(Math.round(current * 30));
      }
    };

    const tick = () => {
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        paint();
        running = false; // settled — stop the loop until the next scroll
        return;
      }
      paint();
      raf = requestAnimationFrame(tick);
    };

    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <>
      <span ref={levelRef} className="xp-level" aria-hidden>
        0
      </span>
      <div className="xp-track" aria-hidden>
        <div ref={fillRef} className="xp-fill" />
        <div className="xp-notches" />
      </div>
    </>
  );
}
