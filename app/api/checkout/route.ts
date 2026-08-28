import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { QUANTITY_OPTIONS } from "@/lib/format";
import { discordAuthConfigured } from "@/lib/discord";
import { getSession } from "@/lib/session";
import { getLinkByDiscord } from "@/lib/moonlink";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const limit = rateLimit(`checkout:${clientIp()}`, 15, 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests — slow down and try again shortly." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    const { packageId, quantity: rawQuantity, username, platform } = await req.json();
    if (typeof packageId !== "string") {
      return NextResponse.json({ error: "packageId required" }, { status: 400 });
    }
    let buyerUsername: string;
    let buyerPlatform: "java" | "bedrock";
    let discordId = "";
    let discordUsername = "";

    if (discordAuthConfigured()) {
      const storeSession = await getSession();
      if (!storeSession) return NextResponse.json({ error: "auth_required" }, { status: 401 });
      if (!storeSession.platform || !storeSession.tosAcceptedAt) {
        return NextResponse.json({ error: "onboarding_required" }, { status: 403 });
      }
      let link;
      try {
        link = await getLinkByDiscord(storeSession.discordId);
      } catch {
        return NextResponse.json({ error: "linking_unavailable" }, { status: 503 });
      }
      if (!link) return NextResponse.json({ error: "link_required" }, { status: 403 });
      buyerUsername = link.player;
      buyerPlatform = storeSession.platform;
      discordId = storeSession.discordId;
      discordUsername = storeSession.discordUsername;
    } else {
      if (typeof username !== "string" || !/^[A-Za-z0-9_ ]{1,16}$/.test(username.trim())) {
        return NextResponse.json({ error: "Invalid Minecraft username" }, { status: 400 });
      }
      buyerUsername = username.trim();
      buyerPlatform = platform === "bedrock" ? "bedrock" : "java";
    }

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
        username: buyerUsername,
        platform: buyerPlatform,
        discordId,
        discordUsername,
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
