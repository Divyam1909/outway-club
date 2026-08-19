import { normalizeCode } from "@/lib/promo";
import { sanitizeText } from "@/lib/rate-limit";

/**
 * Turns whatever the promo form posted into a row the database will accept.
 *
 * Shared by create and update so a code can never be validated by two subtly
 * different sets of rules — the update path is exactly where a "50% off,
 * uncapped, valid forever" slips in if the guards only live on create.
 *
 * The refusals here are the money ones. A percentage over 100 pays the customer
 * to travel; a percentage code with no cap is the difference between ₹900 off
 * and ₹9,000 off on a group of ten, and the person typing it in usually has the
 * first number in mind.
 */

export interface PromoPayload {
  code: string;
  label: string;
  description: string | null;
  discount_type: "percent" | "flat";
  discount_value: number;
  max_discount_amount: number | null;
  per_traveler: boolean;
  min_order_amount: number;
  min_travelers: number;
  usage_limit: number | null;
  per_user_limit: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  auto_apply: boolean;
  trip_ids: string[];
  partner_name: string | null;
  partner_handle: string | null;
  notes: string | null;
}

export type PromoPayloadResult = { payload: PromoPayload } | { error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/** A datetime-local string, or null. Stored as an ISO instant. */
function optionalTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function tripIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry === "string" && UUID.test(entry)) seen.add(entry);
    if (seen.size >= 50) break;
  }
  return [...seen];
}

export function buildPromoPayload(body: Record<string, unknown>): PromoPayloadResult {
  const code = normalizeCode(body.code);
  if (code.length < 3) {
    return { error: "Give the code at least three characters — letters and numbers only." };
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "Codes can only contain letters and numbers, so they survive being read aloud." };
  }

  const label = sanitizeText(body.label, 80);
  if (label.length < 2) {
    return { error: "Give the code a name. The customer sees it on the discount line." };
  }

  const discountType = body.discountType === "percent" ? "percent" : "flat";
  const discountValue = Number(body.discountValue);

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { error: "How much comes off? Set a discount above zero." };
  }
  if (discountType === "percent" && discountValue > 90) {
    return { error: "A discount over 90% is almost always a typo. Set it to 90 or less." };
  }
  if (discountType === "flat" && discountValue > 1_000_000) {
    return { error: "That flat discount is larger than any trip we sell." };
  }

  const maxDiscount = optionalNumber(body.maxDiscountAmount);
  if (maxDiscount !== null && maxDiscount <= 0) {
    return { error: "A discount cap has to be above zero, or leave it blank for no cap." };
  }

  const usageLimit = optionalNumber(body.usageLimit);
  if (usageLimit !== null && (usageLimit < 1 || !Number.isInteger(usageLimit))) {
    return { error: "Total uses has to be a whole number of at least one, or blank for unlimited." };
  }

  const perUserLimit = optionalNumber(body.perUserLimit);
  if (perUserLimit !== null && (perUserLimit < 1 || !Number.isInteger(perUserLimit))) {
    return { error: "Uses per person has to be a whole number of at least one, or blank for unlimited." };
  }

  const minTravelers = optionalNumber(body.minTravelers) ?? 1;
  if (minTravelers < 1 || !Number.isInteger(minTravelers)) {
    return { error: "Minimum travellers has to be a whole number of at least one." };
  }

  const minOrder = optionalNumber(body.minOrderAmount) ?? 0;
  if (minOrder < 0) return { error: "A minimum order can't be negative." };

  const startsAt = optionalTimestamp(body.startsAt);
  const endsAt = optionalTimestamp(body.endsAt);
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
    return { error: "The end of the window has to come after the start." };
  }

  const autoApply = body.autoApply === true;
  const trips = tripIds(body.tripIds);

  // An auto-applying code valid on every trip, forever, is a permanent price
  // cut wearing a promo code's clothes — and it would silently discount trips
  // that don't exist yet. Ops can still do it deliberately by naming the trips.
  if (autoApply && trips.length === 0) {
    return {
      error:
        "An auto-applying code has to name the trips it runs on. Applied to everything it becomes a permanent price cut, including on escapes that don't exist yet.",
    };
  }
  if (autoApply && !endsAt) {
    return { error: "An auto-applying code needs an end date, or nothing ever switches it off." };
  }

  return {
    payload: {
      code,
      label,
      description: sanitizeText(body.description, 300) || null,
      discount_type: discountType,
      discount_value: discountValue,
      max_discount_amount: discountType === "percent" ? maxDiscount : null,
      per_traveler: discountType === "flat" && body.perTraveler === true,
      min_order_amount: minOrder,
      min_travelers: minTravelers,
      usage_limit: usageLimit,
      per_user_limit: perUserLimit,
      starts_at: startsAt,
      ends_at: endsAt,
      is_active: body.isActive !== false,
      auto_apply: autoApply,
      trip_ids: trips,
      partner_name: sanitizeText(body.partnerName, 120) || null,
      partner_handle: sanitizeText(body.partnerHandle, 120) || null,
      notes: sanitizeText(body.notes, 500) || null,
    },
  };
}
