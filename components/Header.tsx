import Link from "next/link";
import { Logo } from "./Branding";
import UserChip from "./UserChip";
import LegacyUserChip from "./LegacyUserChip";
import type { StoreSession } from "@/lib/session";

const links = [
  { href: "/", label: "Home" },
  { href: "/ranks", label: "Ranks" },
  { href: "/crates", label: "Crates & Keys" },
];

export default function Header({
  discordAuth,
  session,
  linkedPlayer,
}: {
  discordAuth: boolean;
  session: StoreSession | null;
  linkedPlayer: string | null;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-night-950/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          {discordAuth ? <UserChip session={session} player={linkedPlayer} /> : <LegacyUserChip />}
        </nav>
      </div>
    </header>
  );
}
