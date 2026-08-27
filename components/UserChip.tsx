import type { StoreSession } from "@/lib/session";
import MinecraftHead from "./MinecraftHead";

export default function UserChip({ session, player }: { session: StoreSession | null; player: string | null }) {
  if (!session) return null;

  return (
    <form action="/api/auth/logout" method="post" title="Sign out">
      <button className="ml-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 transition hover:bg-white/10">
      {player && <MinecraftHead username={player} platform={session.platform ?? "java"} size={20} />}
      <span className="hidden text-xs font-semibold text-slate-200 sm:inline">
        {player ?? session.discordUsername}
      </span>
      </button>
    </form>
  );
}
