"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function addReview(formData: FormData) {
  const packageId = String(formData.get("packageId") ?? "");
  const author = String(formData.get("author") ?? "").trim().slice(0, 32);
  const rating = parseInt(String(formData.get("rating") ?? ""), 10);
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 500);

  if (!author || !Number.isInteger(rating) || rating < 1 || rating > 5) return;

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) return;

  await prisma.review.create({ data: { packageId, author, rating, comment } });
  revalidatePath(`/package/${packageId}`);
}
