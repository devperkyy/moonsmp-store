import Stripe from "stripe";

let stripe: Stripe | null = null;

// Lazy init so `next build` doesn't require the key to be set.
export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripe = new Stripe(key, { apiVersion: "2024-06-20" });
  }
  return stripe;
}
