"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";
import { logAdminAction } from "@/lib/audit";

async function requireAdmin() {
  const ok = await verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!ok) redirect("/admin/login");
}

export async function login(formData: FormData) {
  const ip = clientIp();
  const limit = rateLimit(`admin-login:${ip}`, 8, 10 * 60 * 1000);
  if (!limit.ok) {
    await logAdminAction("login_rate_limited");
    redirect("/admin/login?error=2");
  }

  const password = formData.get("password");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== "string" || password !== expected) {
    await logAdminAction("login_failed");
    redirect("/admin/login?error=1");
  }
  cookies().set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  await logAdminAction("login");
  redirect("/admin");
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function updatePackage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const price = parseFloat(String(formData.get("price")));
  if (!Number.isFinite(price) || price < 0) return;

  const priceCents = Math.round(price * 100);
  const active = formData.get("active") === "on";
  await prisma.package.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").trim() || id,
      description: String(formData.get("description") ?? "").trim(),
      priceCents,
      commandTemplate: String(formData.get("commandTemplate") ?? "").trim(),
      sortOrder: parseInt(String(formData.get("sortOrder") ?? "0"), 10) || 0,
      active,
    },
  });
  await logAdminAction("package_update", `${id}: ${priceCents}c, active=${active}`);

  revalidatePath("/admin/packages");
  revalidatePath("/ranks");
  revalidatePath("/crates");
}

// Re-queue a failed (or stuck) delivery — the plugin picks it up on its next poll.
export async function retryDelivery(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.delivery.update({
    where: { id },
    data: { status: "pending", claimedAt: null, lastError: null },
  });
  await logAdminAction("delivery_retry", id);
  revalidatePath("/admin");
}

// One username per line in the textarea → JSON array in the DB.
export async function setMaintenanceMode(formData: FormData) {
  await requireAdmin();
  const enabled = formData.get("enabled") === "on";
  const message = String(formData.get("message") ?? "").trim();
  const allowlist = String(formData.get("allowlist") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.maintenanceMode.upsert({
    where: { id: 1 },
    create: { id: 1, enabled, message, allowlist: JSON.stringify(allowlist) },
    update: { enabled, message, allowlist: JSON.stringify(allowlist) },
  });
  await logAdminAction("maintenance_update", `enabled=${enabled}, allowlist=${allowlist.length}`);

  // The gate is read in the root layout, so every route needs revalidating.
  revalidatePath("/", "layout");
  revalidatePath("/admin/maintenance");
}
