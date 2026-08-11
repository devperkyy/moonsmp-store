export function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export const QUANTITY_OPTIONS = [1, 3, 5] as const;

// Ranks and crates each display as a storewide sale: the listed price is
// the sale price, and the "was" price is derived from it so admin price
// edits stay in sync.
export const RANK_SALE_PERCENT = 20;
export const CRATE_SALE_PERCENT = 25;

export function salePercentFor(category: string): number | null {
  if (category === "ranks") return RANK_SALE_PERCENT;
  if (category === "crates") return CRATE_SALE_PERCENT;
  return null;
}

export function compareAtCents(priceCents: number, percent: number) {
  return Math.round(priceCents / (1 - percent / 100));
}
