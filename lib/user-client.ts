// Client-side store for the Minecraft identity collected by the entry gate.
// This username is the delivery target for every purchase.

export type StoredUser = { username: string; platform: "java" | "bedrock" };

const KEY = "mc_user";
export const OPEN_GATE_EVENT = "moonsmp:open-gate";
export const USER_CHANGED_EVENT = "moonsmp:user-changed";

// sessionStorage on purpose: the gate (username + ToS) must be completed on
// every visit — a new tab or a closed-and-reopened browser prompts again,
// while navigating between pages within a visit does not.
export function getStoredUser(): StoredUser | null {
  try {
    localStorage.removeItem(KEY); // clear values from the old always-remember version
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (
      typeof user?.username === "string" &&
      user.username.length > 0 &&
      (user.platform === "java" || user.platform === "bedrock")
    ) {
      return user as StoredUser;
    }
  } catch {
    // corrupted storage → treat as signed out
  }
  return null;
}

export function setStoredUser(user: StoredUser) {
  sessionStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(USER_CHANGED_EVENT));
}

export function openGate() {
  window.dispatchEvent(new Event(OPEN_GATE_EVENT));
}

export function isValidUsername(name: string) {
  return /^[A-Za-z0-9_ ]{1,16}$/.test(name.trim()) && name.trim().length > 0;
}
