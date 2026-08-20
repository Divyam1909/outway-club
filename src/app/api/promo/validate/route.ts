import { NextResponse } from "next/server";
import { resolvePromo } from "@/lib/promo";
import { priceOrder } from "@/lib/pricing";
import { RATE_LIMITS, TOO_MANY_REQUESTS, rateLimitRequest } from "@/lib/rate-limit";

/**
 * Quote a promo code for an order, without consuming it.
 *
 * Two things this deliberately does not do:
 *
 *   - It does not take a price. The body names a trip, a date and a headcount;
 *     the money is looked up. A code cannot be made to discount a number the
 *     customer chose.
 *   - It does not claim a use. A code with three uses left can be typed into
 *     the box a hundred times; only sending the request spends one. Claiming
 *     on validate would let anyone burn a collaborator's whole allocation from
 *     the browser console.
 *
 * The reply carries the discount and the label and nothing else — never the
 * usage counters, which are the collaborator's business.
 */
export async function POST(request: Request) {
  if (!(await rateLimitRequest(RATE_LIMITS.promoValidate, request))) {
    return NextResponse.json(TOO_MANY_REQUESTS, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const tripId = typeof body.tripId === "string" ? body.tripId : "";
  const departureId = typeof body.departureId === "string" && body.departureId ? body.departureId : null;
  const travelers = Number(body.travelers);
  const code = typeof body.code === "string" ? body.code : null;

  if (!tripId) {
    return NextResponse.json({ error: "We couldn't tell which trip this is for." }, { status: 400 });
  }

  const pricing = await priceOrder({ tripId, departureId, travelers });
  if (!pricing) {
    return NextResponse.json({ error: "That trip isn't available any more." }, { status: 404 });
  }

  const { applied, notice, noticeTone } = await resolvePromo({
    code,
    tripId: pricing.tripId,
    subtotal: pricing.subtotal,
    travelers: pricing.travelers,
  });

  return NextResponse.json({
    ok: true,
    subtotal: pricing.subtotal,
    pricePerPerson: pricing.pricePerPerson,
    travelers: pricing.travelers,
    applied,
    notice,
    // Whether the sentence is a refusal or a confirmation. The box needs to
    // know: "already applied" in the red the refusals use would read as a
    // problem, and the customer would go looking for one.
    noticeTone,
  });
}
