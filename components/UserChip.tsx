import MinecraftHead from "./MinecraftHead";

// Header chip showing who purchases are delivered to. Fed verified data
// from the layout-level session/Turso read (no client fetch of its own).
// Submitting the form posts to /api/auth/logout, which clears the session
// cookie and redirects — plain HTML form, no client JS required.
export default function UserChip({
  discordUsername,
  discordAvatar,
  linkedPlayer,
  platform,
}: {
  discordUsername: string;
  discordAvatar: string | null;
  linkedPlayer: string | null;
  platform: "java" | "bedrock" | null;
}) {
  return (
    <form action="/api/auth/logout" method="POST" className="ml-2">
      <button
        type="submit"
        title="Sign out"
        className="flex items-center gap-2 border-2 border-black bg-night-800 px-2 py-1 transition hover:bg-night-700"
      >
        {linkedPlayer ? (
          <MinecraftHead username={linkedPlayer} platform={platform ?? "java"} size={20} />
        ) : discordAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={discordAvatar} alt="" width={20} height={20} />
        ) : null}
        <span className="mc-text-shadow hidden font-pixel text-[10px] text-slate-200 sm:inline">
          {linkedPlayer ?? discordUsername}
        </span>
      </button>
    </form>
  );
}
