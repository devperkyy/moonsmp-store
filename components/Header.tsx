import Link from "next/link";
import { Logo } from "./Branding";
import UserChip from "./UserChip";

const links = [
  { href: "/", label: "Home" },
  { href: "/ranks", label: "Ranks" },
  { href: "/crates", label: "Crates & Keys" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-black bg-night-900/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="mc-text-shadow px-2 py-2 font-pixel text-[10px] text-slate-300 transition hover:text-white sm:px-3"
            >
              {l.label}
            </Link>
          ))}
          <UserChip />
        </nav>
      </div>
    </header>
  );
}
