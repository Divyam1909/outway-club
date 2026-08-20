import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import {
  evaluatePromo,
  normalizeCode,
  promoMessage,
  toPublicPromo,
  type PromoFailure,
  type PublicPromo,
} from "@/lib/promo-rules";
import { formatINR } from "@/lib/utils";
import type { AppliedPromo, PromoCode } from "@/lib/types";

/**
 * Promo codes, server side: finding them, pricing them, and spending them.
 *
 * One rule runs through this whole file: **the browser never decides what
 * anything costs.** The form quotes a discount so the customer can see it, but
 * every number that reaches the database is recomputed from the trip's own
 * price row and the code's own terms. A tampered request body can change which
 * code is asked for; it cannot change what that code is worth.
 *
 * The second rule: **at most one code, ever.** Not a list, not a stack — the
 * request carries a single `promoCode` string and `resolvePromo` returns a
 * single applied result. There is no code path that adds two discounts
 * together, which is the only way to be sure two discounts never add together.
 *
 * The arithmetic itself lives in `@/lib/promo-rules`, which has no server
 * imports so the browser can use it too. Re-exported here so callers that
 * already talk to this module don't have to know that.
 */

export * from "@/lib/promo-rules";

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/**
 * Promo reads run on the service role even for anonymous callers.
 *
 * `promo_codes` is admin-only under RLS on purpose — the row carries usage
 * counters and partner attribution that are nobody else's business. The public
 * surface is this module, which reads the row and returns only the discount.
 */
function db() {
  return createAdminClient();
}

export async function findPromoByCode(code: string): Promise<PromoCode | null> {
  if (!isSupabaseConfigured()) return null;
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  const { data, error } = await db()
    .from("promo_codes")
    .select("*")
    .ilike("code", normalized)
    .maybeSingle();

  if (error) {
    console.error("[promo] lookup failed:", error.message);
    return null;
  }
  return (data as PromoCode) ?? null;
}

/**
 * Every code that applies without being typed, right now.
 *
 * Read once per render and reused across cards rather than queried per trip —
 * there are single-digit numbers of these, and the homepage would otherwise ask
 * the same question four times.
 */
export async function getAutoPromos(): Promise<PromoCode[]> {
  if (!isSupabaseConfigured()) return [];

  // Date windows are filtered in `evaluatePromo` rather than in the query.
  // Expressing "null or in range" on two nullable columns needs two `or=`
  // groups, and how PostgREST combines repeated `or` params is exactly the sort
  // of detail that changes under you. There are single-digit numbers of these
  // rows; the filter costs nothing here and cannot be subtly wrong.
  const { data, error } = await db()
    .from("promo_codes")
    .select("*")
    .eq("is_active", true)
    .eq("auto_apply", true);

  if (error) {
    console.error("[promo] auto lookup failed:", error.message);
    return [];
  }
  return (data as PromoCode[]) ?? [];
}

/**
 * The best auto-applying code for one trip at one price, or null.
 *
 * "Best" is the largest discount, so two overlapping event offers resolve to
 * the one the customer would have wanted rather than whichever row Postgres
 * returned first.
 */
export function bestAutoPromo(
  promos: PromoCode[],
  { tripId, subtotal, travelers }: { tripId: string; subtotal: number; travelers: number }
): AppliedPromo | null {
  let best: AppliedPromo | null = null;

  for (const promo of promos) {
    const result = evaluatePromo(promo, { tripId, subtotal, travelers });
    if (!result.ok) continue;
    if (!best || result.promo.discountAmount > best.discountAmount) best = result.promo;
  }
  return best;
}

/** Convenience for a single trip page: one query, one answer. */
export async function getAutoPromoForTrip(
  tripId: string,
  subtotal: number,
  travelers = 1
): Promise<AppliedPromo | null> {
  const promos = await getAutoPromos();
  return bestAutoPromo(promos, { tripId, subtotal, travelers });
}

// ---------------------------------------------------------------------------
// Applying one, for real
// ---------------------------------------------------------------------------

export interface ResolveInput {
  /** What the customer typed, if anything. */
  code?: string | null;
  tripId: string;
  subtotal: number;
  travelers: number;
}

/**
 * Decide which single code applies to an order, without consuming it.
 *
 * The conflict rule lives here and nowhere else: a typed code replaces the
 * auto-applied one **only if it saves more**. Otherwise the auto one stays and
 * the caller is told why, so the customer is never quietly moved onto a worse
 * deal by entering a code they were given in good faith — and never ends up
 * with both.
 *
 * Every branch that returns `applied` unchanged also returns a `notice`, and
 * that is the point: a code the customer typed must always produce a sentence.
 * Silence after pressing Apply is indistinguishable from a broken button.
 */
export async function resolvePromo(input: ResolveInput): Promise<{
  applied: AppliedPromo | null;
  /** Set whenever a typed code did not change what is applied. */
  notice: string | null;
  /**
   * How the notice should read. `error` is "this didn't work"; `info` is "this
   * worked, and here's what happened" — an already-applied code, or one that
   * lost to a bigger offer. Callers that re-quote in the background (on a
   * headcount change, say) show only the `error` ones: nobody typed anything,
   * so "already applied" would be answering a question no one asked.
   */
  noticeTone: "error" | "info";
  failure: PromoFailure | null;
}> {
  const auto = await getAutoPromoForTrip(input.tripId, input.subtotal, input.travelers);
  const typed = normalizeCode(input.code);

  if (!typed) return { applied: auto, notice: null, noticeTone: "info", failure: null };

  // Re-entering the code that is already on the order. Nothing changes, which
  // is exactly why it needs saying out loud — the box clears either way, and a
  // cleared box with no message reads as "it didn't take".
  if (auto && auto.code.toUpperCase() === typed) {
    return {
      applied: auto,
      notice: `${auto.code} is already applied — ${formatINR(auto.discountAmount)} is off your total.`,
      noticeTone: "info",
      failure: null,
    };
  }

  const row = await findPromoByCode(typed);
  if (!row) {
    return {
      applied: auto,
      notice: promoMessage("unknown"),
      noticeTone: "error",
      failure: "unknown",
    };
  }

  const result = evaluatePromo(row, {
    tripId: input.tripId,
    subtotal: input.subtotal,
    travelers: input.travelers,
  });

  if (!result.ok) {
    return {
      applied: auto,
      notice: promoMessage(result.reason),
      noticeTone: "error",
      failure: result.reason,
    };
  }

  if (auto && auto.discountAmount >= result.promo.discountAmount) {
    return {
      applied: auto,
      notice: `${auto.label} already takes more off, so we've kept it — only one code applies at a time.`,
      noticeTone: "info",
      failure: null,
    };
  }

  return {
    applied: result.promo,
    notice: `${result.promo.code} applied — ${formatINR(result.promo.discountAmount)} off.`,
    noticeTone: "info",
    failure: null,
  };
}

/**
 * Take one use of a code and write down that it happened.
 *
 * Two steps in one function because they must not drift: the claim is atomic in
 * Postgres (see `claim_promo_code`), and the redemption row is the audit trail
 * that pays a collaborator. If the caller's own write fails afterwards it must
 * call `releasePromo` — a use burned on a request that was never stored is a
 * seat of somebody's deal gone missing.
 */
export async function claimPromo({
  promo,
  tripId,
  email,
  travelers,
  userId,
  tripRequestId,
  bookingId,
}: {
  promo: AppliedPromo;
  tripId: string;
  email: string | null;
  travelers: number;
  userId?: string | null;
  tripRequestId?: string | null;
  bookingId?: string | null;
}): Promise<{ ok: true } | { ok: false; reason: PromoFailure }> {
  const admin = db();

  const { data, error } = await admin.rpc("claim_promo_code", {
    p_promo_id: promo.id,
    p_email: email,
    p_trip_id: tripId,
    p_subtotal: promo.subtotal,
    p_travelers: travelers,
  });

  if (error) {
    console.error("[promo] claim failed:", error.message);
    return { ok: false, reason: "unknown" };
  }

  // The RPC returns a single-row table.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.ok) {
    return { ok: false, reason: (row?.reason as PromoFailure) ?? "unknown" };
  }

  const { error: auditError } = await admin.from("promo_redemptions").insert({
    promo_code_id: promo.id,
    code: promo.code,
    trip_request_id: tripRequestId ?? null,
    booking_id: bookingId ?? null,
    trip_id: tripId,
    user_id: userId ?? null,
    email: email ? email.toLowerCase() : null,
    num_travelers: travelers,
    subtotal_amount: promo.subtotal,
    discount_amount: promo.discountAmount,
    total_amount: promo.total,
  });

  // The counter has already moved, so a failed audit row is worth logging and
  // carrying on with rather than refusing a booking over.
  if (auditError) console.error("[promo] redemption audit failed:", auditError.message);

  return { ok: true };
}

/** Hand a claimed use back after the write it was for failed. */
export async function releasePromo(promoId: string): Promise<void> {
  try {
    await db().rpc("release_promo_code", { p_promo_id: promoId });
  } catch (error) {
    console.error("[promo] release failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Admin reads
// ---------------------------------------------------------------------------

export type PromoCodeWithUsage = PromoCode & { redemption_count: number };

export async function getPromoCodesForAdmin(): Promise<PromoCodeWithUsage[]> {
  if (!isSupabaseConfigured()) return [];

  const [{ data: codes, error }, { data: redemptions }] = await Promise.all([
    db().from("promo_codes").select("*").order("created_at", { ascending: false }),
    db().from("promo_redemptions").select("promo_code_id"),
  ]);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of redemptions ?? []) {
    counts.set(row.promo_code_id, (counts.get(row.promo_code_id) ?? 0) + 1);
  }

  return ((codes as PromoCode[]) ?? []).map((code) => ({
    ...code,
    redemption_count: counts.get(code.id) ?? 0,
  }));
}

/**
 * The best auto-applying code for each of a set of trips, in the shape the
 * browser is allowed to see.
 *
 * One query for the whole page. The catalogue, the homepage hero and the
 * "also running" rail all need this answer for several trips at once, and
 * asking per card would be four round trips to say the same thing.
 *
 * Eligibility is judged at one traveller and the trip's own price, which is
 * what the cards quote. A code with a minimum spend that a single traveller
 * cannot reach correctly does not appear on the card, and correctly does appear
 * in the booking form once the headcount goes up.
 */
export async function getAutoPromoForTrips(
  trips: { id: string; price_per_person: number; discounted_price: number | null }[]
): Promise<Map<string, PublicPromo>> {
  const result = new Map<string, PublicPromo>();
  if (trips.length === 0) return result;

  const promos = await getAutoPromos();
  if (promos.length === 0) return result;

  for (const trip of trips) {
    const subtotal = Number(trip.discounted_price ?? trip.price_per_person);

    let best: { promo: PromoCode; discount: number } | null = null;
    for (const promo of promos) {
      const evaluated = evaluatePromo(promo, { tripId: trip.id, subtotal, travelers: 1 });
      if (!evaluated.ok) continue;
      if (!best || evaluated.promo.discountAmount > best.discount) {
        best = { promo, discount: evaluated.promo.discountAmount };
      }
    }

    if (best) result.set(trip.id, toPublicPromo(best.promo));
  }

  return result;
}
