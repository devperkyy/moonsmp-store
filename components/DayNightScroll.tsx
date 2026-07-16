"use client";

import { useEffect, useRef } from "react";

// Ties the sun/moon and overall lighting to scroll position: top of the
// page reads as day (sun high, bright sky, no button glow), scrolling down
// sets the sun and raises the moon, darkens the sky, and brings up a
// campfire-warm glow on every .mc-btn via the --night-glow CSS variable.
// Same rAF-lerp pattern as XpBar, targeting elements in NightBackground by
// class rather than sharing refs across the two components.
export default function DayNightScroll() {
  const raf = useRef(0);

  useEffect(() => {
    const daySky = document.querySelector<HTMLElement>(".day-sky");
    const sun = document.querySelector<HTMLElement>(".pixel-sun");
    const moon = document.querySelector<HTMLElement>(".pixel-moon");
    const starLayers = document.querySelectorAll<HTMLElement>(".stars");
    const root = document.documentElement;
    if (!sun || !moon) return;

    let target = 0;
    let current = 0;
    let running = false;

    const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const paint = () => {
      const p = current; // 0 = top of page (day) → 1 = bottom (night)

      if (daySky) daySky.style.opacity = String(1 - p);

      // sun sets as you scroll down; moon rises. A brief overlap window
      // around the midpoint reads like a natural dusk crossfade.
      sun.style.opacity = String(clamp01(1 - p * 1.6));
      sun.style.top = `${lerp(9, 70, p)}vh`;
      moon.style.opacity = String(clamp01(p * 1.6 - 0.6));
      moon.style.top = `${lerp(70, 9, p)}vh`;

      starLayers.forEach((el) => {
        el.style.opacity = String(clamp01(p * 1.4 - 0.3));
      });

      root.style.setProperty("--night-glow", String(p));
    };

    const tick = () => {
      current += (target - current) * 0.08;
      if (Math.abs(target - current) < 0.001) {
        current = target;
        paint();
        running = false;
        return;
      }
      paint();
      raf.current = requestAnimationFrame(tick);
    };

    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = max > 0 ? clamp01(window.scrollY / max) : 0;
      if (!running) {
        running = true;
        raf.current = requestAnimationFrame(tick);
      }
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return null;
}
