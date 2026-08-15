import type { StoreSession } from "@/lib/session";
import MinecraftHead from "./MinecraftHead";

export default function UserChip({ session, player }: { session: StoreSession | null; player: string | null }) {
  if (!session) return null;

  return (
    <form action="/api/auth/logout" method="post" title="Sign out">
      <button className="ml-2 flex items-center gap-2 border-2 border-black bg-night-800 px-2 py-1 transition hover:bg-night-700">
      {player && <MinecraftHead username={player} platform={session.platform ?? "java"} size={20} />}
      <span className="mc-text-shadow hidden font-pixel text-[10px] text-slate-200 sm:inline">
        {player ?? session.discordUsername}
      </span>
      </button>
    </form>
  );
}
