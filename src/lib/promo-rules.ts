import type { AppliedPromo, PromoCode } from "@/lib/types";

/**
 * Promo code rules and arithmetic, with no database and no server imports.
 *
 * Split out from `@/lib/promo` deliberately: that module reaches the
 * service-role client and is poisoned for client bundles, and the admin form
 * and the checkout box both need to *describe* a code in the browser. Anything
 * here is a pure function of its arguments, which also makes it the part worth
 * reasoning about carefully — every rupee the site discounts is decided by
 * `discountFor`.
 */

/** Why a code didn't apply, in words a customer can act on. */
export type PromoFailure =
  | "unknown"
  | "inactive"
  | "not_started"
  | "expired"
  | "wrong_trip"
  | "min_order"
  | "min_travelers"
  | "used_up"
  | "per_user";

export type PromoResult =
  | { ok: true; promo: AppliedPromo; row: PromoCode }
  | { ok: false; reason: PromoFailure };

export const PROMO_MESSAGES: Record<PromoFailure, string> = {
  unknown: "That code isn't one of ours. Check the spelling and try again.",
  inactive: "That code has been switched off.",
  not_started: "That code isn't live yet.",
  expired: "That code has expired.",
  wrong_trip: "That code isn't valid on this escape.",
  min_order: "Your total isn't high enough for that code yet.",
  min_travelers: "That code needs more travellers on the booking.",
  used_up: "That code has been fully claimed.",
  per_user: "You've already used that code.",
};

export function promoMessage(reason: PromoFailure): string {
  return PROMO_MESSAGES[reason];
}

/** Codes are matched case- and space-insensitively; stored uppercase. */
export function normalizeCode(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, "").toUpperCase().slice(0, 40);
}

// ---------------------------------------------------------------------------
// The arithmetic
// ---------------------------------------------------------------------------

/**
 * What a code is worth on one order.
 *
 * Rounded to whole rupees, and clamped to the subtotal — a ₹1,000-a-head code
 * on a ₹500 order must come out as ₹500 off, not as ₹500 owed back. Percentage
 * codes additionally obey `max_discount_amount`, which is what stops "10% off"
 * quietly becoming ₹9,000 on a group of ten.
 */
export function discountFor(
  promo: Pick<
    PromoCode,
    "discount_type" | "discount_value" | "max_discount_amount" | "per_traveler"
  >,
  subtotal: number,
  travelers: number
): number {
  if (subtotal <= 0) return 0;

  let raw: number;
  if (promo.discount_type === "percent") {
    raw = (subtotal * Number(promo.discount_value)) / 100;
    if (promo.max_discount_amount !== null && promo.max_discount_amount > 0) {
      raw = Math.min(raw, Number(promo.max_discount_amount));
    }
  } else {
    raw = Number(promo.discount_value) * (promo.per_traveler ? Math.max(travelers, 1) : 1);
  }

  return Math.max(0, Math.min(Math.round(raw), Math.round(subtotal)));
}

/**
 * Everything about a code that does not need the database: is it switched on,
 * is it inside its window, is it valid on this trip, is the order big enough.
 *
 * Usage limits are deliberately NOT checked here. They are a race, and a race
 * is only settled by the atomic claim in `claim_promo_code` — checking a
 * counter here would produce a "valid!" that turns into a "sorry" one click
 * later. What this does check is everything a customer can fix themselves.
 */
export function evaluatePromo(
  promo: PromoCode,
  { tripId, subtotal, travelers }: { tripId: string; subtotal: number; travelers: number }
): PromoResult {
  if (!promo.is_active) return { ok: false, reason: "inactive" };

  const now = Date.now();
  if (promo.starts_at && now < new Date(promo.starts_at).getTime()) {
    return { ok: false, reason: "not_started" };
  }
  if (promo.ends_at && now > new Date(promo.ends_at).getTime()) {
    return { ok: false, reason: "expired" };
  }
  if (promo.trip_ids.length > 0 && !promo.trip_ids.includes(tripId)) {
    return { ok: false, reason: "wrong_trip" };
  }
  if (travelers < promo.min_travelers) return { ok: false, reason: "min_travelers" };
  if (subtotal < Number(promo.min_order_amount)) return { ok: false, reason: "min_order" };

  // A code whose limit is already exhausted is worth refusing early too — the
  // atomic claim is the guarantee, this is just a better error sooner.
  if (promo.usage_limit !== null && promo.times_used >= promo.usage_limit) {
    return { ok: false, reason: "used_up" };
  }

  const discountAmount = discountFor(promo, subtotal, travelers);
  if (discountAmount <= 0) return { ok: false, reason: "min_order" };

  return {
    ok: true,
    row: promo,
    promo: {
      id: promo.id,
      code: promo.code,
      label: promo.label,
      description: promo.description,
      auto: promo.auto_apply,
      discountAmount,
      subtotal: Math.round(subtotal),
      total: Math.round(subtotal) - discountAmount,
      endsAt: promo.ends_at,
    },
  };
}

// ---------------------------------------------------------------------------
// Description helpers, shared by the admin console and the checkout box
// ---------------------------------------------------------------------------

/** Live status for the admin list — the same words the badge shows. */
export function promoStatus(promo: PromoCode): {
  tone: "pine" | "gold" | "ink" | "clay";
  label: string;
} {
  if (!promo.is_active) return { tone: "ink", label: "Off" };
  const now = Date.now();
  if (promo.starts_at && now < new Date(promo.starts_at).getTime()) {
    return { tone: "gold", label: "Scheduled" };
  }
  if (promo.ends_at && now > new Date(promo.ends_at).getTime()) {
    return { tone: "ink", label: "Expired" };
  }
  if (promo.usage_limit !== null && promo.times_used >= promo.usage_limit) {
    return { tone: "clay", label: "Fully claimed" };
  }
  return { tone: "pine", label: "Live" };
}

/** "10% off", "₹1,000 off each" — one line, for tables and line items. */
export function promoValueLabel(promo: Pick<PromoCode, "discount_type" | "discount_value" | "per_traveler">): string {
  if (promo.discount_type === "percent") return `${Number(promo.discount_value)}% off`;
  return `₹${Number(promo.discount_value).toLocaleString("en-IN")} off${
    promo.per_traveler ? " each" : ""
  }`;
}


// ---------------------------------------------------------------------------
// The public shape
// ---------------------------------------------------------------------------

/**
 * What a promo code looks like to the browser.
 *
 * Same column names as the row, minus everything commercial: no usage counters,
 * no partner attribution, no internal notes. Those tell anyone with a network
 * tab how much of a collaborator's deal is left, which is the collaborator's
 * business.
 *
 * It carries exactly the fields `discountFor` needs, so the price a card shows
 * and the price the server stores are computed by the same function rather than
 * by two implementations that agree until one of them is edited.
 */
export type PublicPromo = Pick<
  PromoCode,
  | "code"
  | "label"
  | "description"
  | "discount_type"
  | "discount_value"
  | "max_discount_amount"
  | "per_traveler"
  | "min_order_amount"
  | "min_travelers"
  | "ends_at"
>;

export function toPublicPromo(promo: PromoCode): PublicPromo {
  return {
    code: promo.code,
    label: promo.label,
    description: promo.description,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    max_discount_amount: promo.max_discount_amount,
    per_traveler: promo.per_traveler,
    min_order_amount: promo.min_order_amount,
    min_travelers: promo.min_travelers,
    ends_at: promo.ends_at,
  };
}

/**
 * What an auto-applying code takes off, for display only.
 *
 * Returns 0 rather than throwing when the order doesn't qualify, so a widget
 * can call it on every keystroke of the traveller stepper and simply stop
 * showing a discount when the minimum stops being met. The binding number is
 * always the one `/api/promo/validate` returns.
 */
export function publicDiscount(
  promo: PublicPromo,
  subtotal: number,
  travelers: number
): number {
  if (travelers < promo.min_travelers) return 0;
  if (subtotal < Number(promo.min_order_amount)) return 0;
  return discountFor(promo, subtotal, travelers);
}

/**
 * The two numbers a page shows for a trip.
 *
 * Exactly two, always: one struck through and one live. A trip can carry a
 * `discounted_price` *and* have an auto-applying code on it, and printing three
 * figures ("was ₹9,999, now ₹8,999, ₹7,999 with the code") is how a price stops
 * being believable. So the struck-through number is always the list price and
 * the live one is what you actually pay after everything.
 *
 * `saving` is the difference between them, which is the only honest thing a
 * "save ₹X" badge can say.
 */
export function tripPricing(
  trip: { price_per_person: number; discounted_price: number | null },
  promo?: PublicPromo | null
): { effective: number; struck: number | null; saving: number; promoDiscount: number } {
  const list = Number(trip.price_per_person);
  const base = Number(trip.discounted_price ?? trip.price_per_person);
  const promoDiscount = promo ? publicDiscount(promo, base, 1) : 0;
  const effective = Math.max(0, base - promoDiscount);

  return {
    effective,
    struck: effective < list ? list : null,
    saving: Math.max(0, list - effective),
    promoDiscount,
  };
}
