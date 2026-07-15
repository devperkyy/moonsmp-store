import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { QUANTITY_OPTIONS } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { packageId, quantity: rawQuantity, username, platform } = await req.json();
    if (typeof packageId !== "string") {
      return NextResponse.json({ error: "packageId required" }, { status: 400 });
    }
    // Delivery target comes from the site's entry gate, not Stripe.
    if (typeof username !== "string" || !/^[A-Za-z0-9_ ]{1,16}$/.test(username.trim())) {
      return NextResponse.json({ error: "Invalid Minecraft username" }, { status: 400 });
    }
    const buyerPlatform = platform === "bedrock" ? "bedrock" : "java";

    const pkg = await prisma.package.findFirst({ where: { id: packageId, active: true } });
    if (!pkg) {
      return NextResponse.json({ error: "Unknown package" }, { status: 404 });
    }

    // Ranks are one-time purchases; only crates/keys sell in multiples.
    const quantity =
      pkg.category === "crates" && QUANTITY_OPTIONS.includes(rawQuantity)
        ? (rawQuantity as number)
        : 1;

    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity,
          price_data: {
            currency: pkg.currency,
            unit_amount: pkg.priceCents,
            product_data: {
              name: pkg.name,
              description: pkg.description || undefined,
            },
          },
        },
      ],
      metadata: {
        packageId: pkg.id,
        quantity: String(quantity),
        username: username.trim(),
        platform: buyerPlatform,
      },
      success_url: `${site}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/${pkg.category === "ranks" ? "ranks" : "crates"}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
