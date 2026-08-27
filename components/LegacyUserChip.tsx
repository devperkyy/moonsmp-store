"use client";

import { useEffect, useState } from "react";
import { USER_CHANGED_EVENT, getStoredUser, openGate, type StoredUser } from "@/lib/user-client";
import MinecraftHead from "./MinecraftHead";

export default function LegacyUserChip() {
  const [user, setUser] = useState<StoredUser | null>(null);
  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    sync();
    window.addEventListener(USER_CHANGED_EVENT, sync);
    return () => window.removeEventListener(USER_CHANGED_EVENT, sync);
  }, []);
  if (!user) return null;
  return (
    <button onClick={openGate} title="Change player" className="ml-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 transition hover:bg-white/10">
      <MinecraftHead username={user.username} platform={user.platform} size={20} />
      <span className="hidden text-xs font-semibold text-slate-200 sm:inline">{user.username}</span>
    </button>
  );
}
