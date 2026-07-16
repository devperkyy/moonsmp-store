import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PackageImage from "@/components/PackageImage";
import PurchasePanel from "@/components/PurchasePanel";
import { addReview } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const pkg = await prisma.package.findUnique({ where: { id: params.id } });
  return { title: pkg?.name ?? "Package" };
}

function Stars({ value, className = "text-xl" }: { value: number; className?: string }) {
  const filled = Math.round(value);
  return (
    <span className={`${className} tracking-wider text-amber-400`}>
      {"★".repeat(filled)}
      <span className="text-slate-600">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

export default async function PackagePage({ params }: { params: { id: string } }) {
  const pkg = await prisma.package.findFirst({
    where: { id: params.id, active: true },
    include: { reviews: { orderBy: { createdAt: "desc" }, take: 25 } },
  });
  if (!pkg) notFound();

  const bought = await prisma.order.count({
    where: { packageId: pkg.id, status: "paid" },
  });
  const avgRating = pkg.reviews.length
    ? pkg.reviews.reduce((sum, r) => sum + r.rating, 0) / pkg.reviews.length
    : 0;

  const backHref = pkg.category === "ranks" ? "/ranks" : "/crates";
  const backLabel = pkg.category === "ranks" ? "Ranks" : "Crates & Keys";

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <span aria-hidden>←</span> Back to {backLabel}
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-[1fr,340px]">
        {/* left: photo, name, stars */}
        <div>
          <PackageImage
            id={pkg.id}
            name={pkg.name}
            className="aspect-[4/3] w-full border-2 border-black shadow-2xl shadow-black/50"
            iconClassName="text-8xl"
          />
          <h1 className="mc-text-shadow mt-6 font-pixel text-xl text-white">{pkg.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Stars value={avgRating} />
            <span className="text-sm text-slate-500">
              {pkg.reviews.length === 0
                ? "No reviews yet"
                : `${avgRating.toFixed(1)} · ${pkg.reviews.length} review${pkg.reviews.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <p className="mt-4 max-w-prose leading-relaxed text-slate-300">{pkg.description}</p>
        </div>

        {/* right: price, created, bought, 1x/3x/5x, buy */}
        <PurchasePanel
          packageId={pkg.id}
          allowQuantity={pkg.category === "crates"}
          showSale={pkg.category === "ranks"}
          priceCents={pkg.priceCents}
          currency={pkg.currency}
          createdAt={pkg.createdAt.toLocaleDateString("en-CA", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          bought={bought}
        />
      </div>

      {/* reviews */}
      <section className="mt-16 max-w-3xl">
        <h2 className="mc-text-shadow font-pixel text-base text-white">Reviews</h2>

        <form action={addReview} className="mc-panel mt-4 p-5">
          <input type="hidden" name="packageId" value={pkg.id} />
          <div className="grid gap-4 sm:grid-cols-[1fr,140px]">
            <label className="text-sm font-medium text-slate-300">
              Minecraft username
              <input
                name="author"
                required
                maxLength={32}
                className="mt-1 w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 text-white outline-none focus:border-moon-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-300">
              Rating
              <select
                name="rating"
                defaultValue="5"
                className="mt-1 w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 text-white outline-none focus:border-moon-500"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {"★".repeat(r)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-300">
            Comment <span className="text-slate-500">(optional)</span>
            <textarea
              name="comment"
              rows={2}
              maxLength={500}
              className="mt-1 w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 text-white outline-none focus:border-moon-500"
            />
          </label>
          <button className="mc-btn mc-btn-green mt-4">Post review</button>
        </form>

        <div className="mt-6 space-y-4">
          {pkg.reviews.length === 0 && (
            <p className="text-sm text-slate-500">Be the first to review {pkg.name}.</p>
          )}
          {pkg.reviews.map((review) => (
            <div key={review.id} className="mc-panel p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-white">{review.author}</span>
                <Stars value={review.rating} className="text-sm" />
                <span className="ml-auto text-xs text-slate-500">
                  {review.createdAt.toLocaleDateString("en-CA")}
                </span>
              </div>
              {review.comment && (
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
