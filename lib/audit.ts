import { prisma } from "@/lib/db";
import { clientIp } from "@/lib/client-ip";

// Fire-and-forget: a logging failure must never break the admin action it's
// recording.
export async function logAdminAction(action: string, detail = "") {
  try {
    await prisma.adminAuditLog.create({ data: { action, detail, ip: clientIp() } });
  } catch {
    // best-effort only
  }
}
