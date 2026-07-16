export function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export const QUANTITY_OPTIONS = [1, 3, 5] as const;

// Ranks display as a storewide sale: the listed price is the sale price,
// and the "was" price is derived from it so admin price edits stay in sync.
export const RANK_SALE_PERCENT = 20;

export function compareAtCents(priceCents: number) {
  return Math.round(priceCents / (1 - RANK_SALE_PERCENT / 100));
}
