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

async function requireAdmin() {
  const ok = await verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!ok) redirect("/admin/login");
}

export async function login(formData: FormData) {
  const password = formData.get("password");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== "string" || password !== expected) {
    redirect("/admin/login?error=1");
  }
  cookies().set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
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

  await prisma.package.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").trim() || id,
      description: String(formData.get("description") ?? "").trim(),
      priceCents: Math.round(price * 100),
      commandTemplate: String(formData.get("commandTemplate") ?? "").trim(),
      sortOrder: parseInt(String(formData.get("sortOrder") ?? "0"), 10) || 0,
      active: formData.get("active") === "on",
    },
  });

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
  revalidatePath("/admin");
}
