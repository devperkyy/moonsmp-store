"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Full-page block for everyone except the /admin/maintenance allowlist.
// Never covers /admin itself — whoever flipped this on isn't automatically
// exempt, so they get booted to this same screen like any other visitor,
// but the "Re-enter admin" link always gets them back in (their separate
// admin session cookie is untouched by any of this).
export default function MaintenanceGate({
  enabled,
  message,
  allowed,
}: {
  enabled: boolean;
  message: string;
  allowed: boolean;
}) {
  const pathname = usePathname();
  const suppressed = pathname.startsWith("/admin");
  const visible = enabled && !allowed && !suppressed;

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex min-h-screen items-center justify-center overflow-y-auto bg-night-950/70 p-4 backdrop-blur-md">
      <Link
        href="/admin"
        className="absolute right-4 top-4 text-xs font-semibold text-slate-400 transition hover:text-white"
      >
        Re-enter admin →
      </Link>
      <div className="mc-panel w-full max-w-lg p-8 text-center">
        <p className="text-2xl font-extrabold tracking-tight text-white">Moon SMP Store</p>
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-amber-300">
          Currently in maintenance
        </p>
        <p className="mt-5 text-sm leading-relaxed text-slate-300">
          {message || "We're making some upgrades. Check back shortly!"}
        </p>
      </div>
    </div>
  );
}
