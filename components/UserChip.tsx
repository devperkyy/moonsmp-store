"use client";

import { useEffect, useState } from "react";
import {
  USER_CHANGED_EVENT,
  getStoredUser,
  openGate,
  type StoredUser,
} from "@/lib/user-client";
import MinecraftHead from "./MinecraftHead";

// Header chip showing who purchases are delivered to; click to change.
export default function UserChip() {
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    sync();
    window.addEventListener(USER_CHANGED_EVENT, sync);
    return () => window.removeEventListener(USER_CHANGED_EVENT, sync);
  }, []);

  if (!user) return null;

  return (
    <button
      onClick={openGate}
      title="Change player"
      className="ml-2 flex items-center gap-2 border-2 border-black bg-night-800 px-2 py-1 transition hover:bg-night-700"
    >
      <MinecraftHead username={user.username} platform={user.platform} size={20} />
      <span className="mc-text-shadow hidden font-pixel text-[10px] text-slate-200 sm:inline">
        {user.username}
      </span>
    </button>
  );
}
