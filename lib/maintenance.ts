import { prisma } from "@/lib/db";

export type MaintenanceState = {
  enabled: boolean;
  message: string;
  allowlist: string[];
};

// Singleton row (id 1), created on first save from /admin/maintenance.
// No row yet = maintenance has never been turned on.
export async function getMaintenanceState(): Promise<MaintenanceState> {
  const row = await prisma.maintenanceMode.findUnique({ where: { id: 1 } });
  if (!row) return { enabled: false, message: "", allowlist: [] };
  let allowlist: string[] = [];
  try {
    const parsed = JSON.parse(row.allowlist);
    if (Array.isArray(parsed)) allowlist = parsed.filter((v) => typeof v === "string");
  } catch {
    // malformed JSON in the DB — treat as an empty allowlist rather than crash
  }
  return { enabled: row.enabled, message: row.message, allowlist };
}

// Discord usernames match case-insensitively — admins shouldn't have to get
// capitalization exactly right when typing the allowlist.
export function isAllowedDuringMaintenance(
  state: MaintenanceState,
  discordUsername: string | null | undefined,
): boolean {
  if (!discordUsername) return false;
  const name = discordUsername.toLowerCase();
  return state.allowlist.some((u) => u.toLowerCase() === name);
}
