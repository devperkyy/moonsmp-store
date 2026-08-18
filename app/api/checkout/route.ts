import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { QUANTITY_OPTIONS } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getLinkByDiscord, linkingConfigured } from "@/lib/moonlink";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { packageId, quantity: rawQuantity } = body;
    if (typeof packageId !== "string") {
      return NextResponse.json({ error: "packageId required" }, { status: 400 });
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

    let username: string;
    let buyerPlatform: "java" | "bedrock";
    let discordId: string | undefined;
    let discordUsername: string | undefined;

    const discordConfigured = Boolean(process.env.DISCORD_CLIENT_ID);

    if (discordConfigured) {
      // Real identity: never trust anything the client claims about who
      // they are. platform/tosAcceptedAt come from the signed session; the
      // Minecraft username is re-verified live against Turso right here,
      // never from a cached cookie claim — see lib/session.ts for why.
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "auth_required" }, { status: 401 });
      }
      if (!session.platform || !session.tosAcceptedAt) {
        return NextResponse.json({ error: "onboarding_incomplete" }, { status: 403 });
      }
      if (!linkingConfigured()) {
        return NextResponse.json({ error: "linking_unavailable" }, { status: 503 });
      }
      const link = await getLinkByDiscord(session.discordId);
      if (!link) {
        // Covers both "genuinely never linked" and "Turso hiccup while
        // fetching" (getLinkByDiscord swallows DB errors and returns null
        // for either) — either way checkout must not proceed, so both fail
        // closed identically here.
        return NextResponse.json({ error: "not_linked" }, { status: 403 });
      }
      username = link.player;
      buyerPlatform = session.platform;
      discordId = session.discordId;
      discordUsername = session.discordUsername;
    } else {
      // Kill-switch / legacy path: old self-reported identity, unchanged.
      const { username: rawUsername, platform } = body;
      if (typeof rawUsername !== "string" || !/^[A-Za-z0-9_ ]{1,16}$/.test(rawUsername.trim())) {
        return NextResponse.json({ error: "Invalid Minecraft username" }, { status: 400 });
      }
      username = rawUsername.trim();
      buyerPlatform = platform === "bedrock" ? "bedrock" : "java";
    }

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
        username,
        platform: buyerPlatform,
        ...(discordId ? { discordId } : {}),
        ...(discordUsername ? { discordUsername } : {}),
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
