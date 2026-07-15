import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { normalizeUsername, renderCommands, type Platform } from "@/lib/minecraft";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    // Async payment methods land later via checkout.session.async_payment_succeeded;
    // cards (the normal case) are always "paid" here.
    return NextResponse.json({ received: true });
  }

  const packageId = session.metadata?.packageId;
  const pkg = packageId
    ? await prisma.package.findUnique({ where: { id: packageId } })
    : null;
  if (!pkg) {
    console.error(`webhook: session ${session.id} has unknown packageId "${packageId}"`);
    return NextResponse.json({ received: true });
  }

  // Username + edition were confirmed by the buyer at the site's entry gate
  // and travel through Stripe as session metadata.
  const rawUsername = session.metadata?.username ?? "";
  const platform = (session.metadata?.platform === "bedrock" ? "bedrock" : "java") as Platform;
  if (!rawUsername) {
    console.error(`webhook: session ${session.id} has no username in metadata`);
    return NextResponse.json({ received: true });
  }

  const effectiveUsername = normalizeUsername(rawUsername, platform);
  // e.g. 3x Vote Key = the key command runs 3 times (one Delivery row each)
  const quantity = Math.min(Math.max(parseInt(session.metadata?.quantity ?? "1", 10) || 1, 1), 10);
  const commands = Array.from({ length: quantity }, () =>
    renderCommands(pkg.commandTemplate, effectiveUsername)
  ).flat();

  try {
    await prisma.order.create({
      data: {
        stripeSessionId: session.id,
        packageId: pkg.id,
        username: rawUsername,
        platform,
        effectiveUsername,
        email: session.customer_details?.email ?? null,
        quantity,
        amountCents: session.amount_total ?? pkg.priceCents * quantity,
        currency: session.currency ?? pkg.currency,
        status: "paid",
        deliveries: {
          create: commands.map((command) => ({ command, status: "pending" })),
        },
      },
    });
  } catch (err: unknown) {
    // Unique constraint on stripeSessionId → duplicate webhook delivery, already handled.
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json({ received: true });
    }
    throw err;
  }

  return NextResponse.json({ received: true });
}
