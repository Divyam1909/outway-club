import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import {
  RATE_LIMITS,
  TOO_MANY_REQUESTS,
  isBotSubmission,
  isValidEmail,
  rateLimitRequest,
  sanitizeMultiline,
  sanitizeText,
} from "@/lib/rate-limit";
import {
  tripRequestAcknowledgementEmail,
  tripRequestAlertEmail,
  sendEmail,
  type TripRequestEmailData,
} from "@/lib/email";
import {
  QUESTIONNAIRE,
  answerLabel,
  isValidAnswer,
  questionLabel,
} from "@/config/trip-request";
import { claimPromo, getAutoPromoForTrip, releasePromo, resolvePromo } from "@/lib/promo";
import { priceOrder } from "@/lib/pricing";
import { formatDateRange, formatINR } from "@/lib/utils";
import { site } from "@/config/site";

/**
 * Booking requests from the pre-booking questionnaire.
 *
 * This is what "Book now" leads to while payments are off. It writes a row to
 * `trip_requests` and emails ops — it does NOT create a booking, touch a
 * departure's seat count, or reserve anything. Confirming a request is a human
 * step, deliberately.
 *
 * Open to signed-out visitors: there is no money involved, and putting a
 * signup wall in front of an enquiry only loses the enquiry. If the sender does
 * happen to be signed in we record their user id, so ops can join it up later.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!(await rateLimitRequest(RATE_LIMITS.tripRequest, request))) {
    return NextResponse.json(TOO_MANY_REQUESTS, { status: 429 });
  }

  // Silently accept and discard bot submissions so they don't retry.
  if (isBotSubmission(body)) {
    return NextResponse.json({ ok: true });
  }

  const tripId = typeof body.tripId === "string" ? body.tripId : "";
  const requestedDepartureId =
    typeof body.departureId === "string" && body.departureId ? body.departureId : null;

  const name = sanitizeText(body.name, 120);
  const email = sanitizeText(body.email, 254).toLowerCase();
  const phone = sanitizeText(body.phone, 32);
  const numTravelers = Math.round(Number(body.numTravelers));

  const originCity = sanitizeText(body.originCity, 40);
  const originCityOther = sanitizeText(body.originCityOther, 80);
  const travelHelp = sanitizeText(body.travelHelp, 40);

  const dealBreakers = sanitizeMultiline(body.dealBreakers, 1000) || null;
  const notes = sanitizeMultiline(body.notes, 2000) || null;

  if (!tripId) {
    return NextResponse.json({ error: "We couldn't tell which trip this is for." }, { status: 400 });
  }
  if (name.length < 2) {
    return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json(
      { error: "Please add a phone number we can reach you on, at least 10 digits." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(numTravelers) || numTravelers < 1 || numTravelers > 40) {
    return NextResponse.json({ error: "How many of you are travelling?" }, { status: 400 });
  }
  if (!isValidAnswer("origin_city", originCity)) {
    return NextResponse.json({ error: "Please pick where you're starting from." }, { status: 400 });
  }
  if (originCity === "other" && originCityOther.length < 2) {
    return NextResponse.json({ error: "Please type the city you're starting from." }, { status: 400 });
  }
  if (!isValidAnswer("travel_help", travelHelp)) {
    return NextResponse.json(
      { error: "Please tell us whether we should book your flight or train." },
      { status: 400 }
    );
  }

  // The questionnaire. All of it is required — the whole point is that every
  // request arrives with the same answers, so groups can be built from them.
  const answers: Record<string, string> = {};
  for (const question of QUESTIONNAIRE) {
    const value = sanitizeText((body.answers as Record<string, unknown> | undefined)?.[question.id], 40);
    if (!isValidAnswer(question.id, value)) {
      return NextResponse.json(
        { error: `Please answer: ${question.label}` },
        { status: 400 }
      );
    }
    answers[question.id] = value;
  }

  const admin = createAdminClient();

  // Signed-in is optional here, and a broken session must not cost us the lead.
  let userId: string | null = null;
  try {
    userId = (await getCurrentUser())?.user.id ?? null;
  } catch {
    userId = null;
  }

  const { data: trip } = await admin
    .from("trips")
    .select("id, title")
    .eq("id", tripId)
    .maybeSingle();

  if (!trip) {
    return NextResponse.json({ error: "That trip isn't available any more." }, { status: 404 });
  }

  /**
   * The date, checked against this trip rather than taken on trust.
   *
   * The form can only offer this trip's own departures, so anything else is a
   * stale tab or a hand-made payload. It is dropped rather than refused: the
   * row simply carries no date and ops ask for one, which costs a question.
   * Storing it unchecked would file the request under another trip's weekend,
   * and refusing it would throw away a real lead over a tab left open. A
   * departure deleted between the page load and the send lands here too —
   * that used to be a foreign-key error and a 500 in the sender's face.
   */
  let departure: { id: string; start_date: string; end_date: string } | null = null;

  if (requestedDepartureId) {
    const { data } = await admin
      .from("departures")
      .select("id, start_date, end_date")
      .eq("id", requestedDepartureId)
      .eq("trip_id", trip.id)
      .maybeSingle();
    departure = data ?? null;
  }

  const departureId = departure?.id ?? null;

  // ---------------------------------------------------------------------------
  // Money.
  //
  // The browser sent a code, and nothing else about the price. Everything from
  // here is derived: `priceOrder` reads the trip and departure rows,
  // `resolvePromo` re-checks the code against them, and whatever the form was
  // displaying is irrelevant. A request body claiming a ₹1 total gets a
  // correctly priced row.
  // ---------------------------------------------------------------------------
  const pricing = await priceOrder({
    tripId: trip.id,
    departureId,
    travelers: numTravelers,
  });

  const typedCode = typeof body.promoCode === "string" ? body.promoCode : null;

  const resolved = pricing
    ? await resolvePromo({
        code: typedCode,
        tripId: trip.id,
        subtotal: pricing.subtotal,
        travelers: pricing.travelers,
      })
    : { applied: null };

  const subtotal = pricing?.subtotal ?? null;

  /**
   * Spend the use *before* the insert, so two people racing for the last use of
   * a capped code can't both get it. If the insert then fails, the use is
   * handed straight back below.
   *
   * A code that ran out in the seconds between the quote and the send falls
   * back to whatever applies on its own rather than to full price — losing a
   * collaborator's code is one thing, silently dropping the event discount the
   * customer could see on the previous screen is another.
   */
  let effectivePromo = null;

  if (pricing && resolved.applied) {
    const candidates = [resolved.applied];

    if (!resolved.applied.auto) {
      const auto = await getAutoPromoForTrip(trip.id, pricing.subtotal, pricing.travelers);
      if (auto && auto.id !== resolved.applied.id) candidates.push(auto);
    }

    for (const candidate of candidates) {
      const claim = await claimPromo({
        promo: candidate,
        tripId: trip.id,
        email,
        travelers: numTravelers,
        userId,
      });
      if (claim.ok) {
        effectivePromo = candidate;
        break;
      }
    }
  }

  const effectiveDiscount = effectivePromo?.discountAmount ?? 0;
  const effectiveTotal = effectivePromo ? effectivePromo.total : subtotal;

  const { data: inserted, error } = await admin
    .from("trip_requests")
    .insert({
      trip_id: trip.id,
      departure_id: departureId,
      user_id: userId,
      name,
      email,
      phone,
      num_travelers: numTravelers,
      origin_city: originCity,
      origin_city_other: originCity === "other" ? originCityOther : null,
      travel_help: travelHelp,
      ...answers,
      deal_breakers: dealBreakers,
      notes,
      promo_code_id: effectivePromo?.id ?? null,
      promo_code: effectivePromo?.code ?? null,
      subtotal_amount: subtotal,
      discount_amount: effectiveDiscount,
      total_amount: effectiveTotal,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[trip-requests] insert failed:", error.message);
    // Give the code's use back — a burned use with no request behind it is a
    // seat of somebody's allocation gone missing for no reason.
    if (effectivePromo) await releasePromo(effectivePromo.id);
    return NextResponse.json(
      { error: "We couldn't save that just now. Please try again in a moment." },
      { status: 500 }
    );
  }

  // Tie the redemption row to the request now that there is one to tie it to.
  if (effectivePromo) {
    await admin
      .from("promo_redemptions")
      .update({ trip_request_id: inserted.id })
      .eq("promo_code_id", effectivePromo.id)
      .is("trip_request_id", null)
      .eq("email", email.toLowerCase());
  }

  // Resolved and checked above, so a request that arrived with no usable
  // date simply quotes none back.
  const dateRange = departure ? formatDateRange(departure.start_date, departure.end_date) : null;

  const payload: TripRequestEmailData = {
    requestId: inserted.id,
    name,
    email,
    phone,
    tripTitle: trip.title,
    dateRange,
    numTravelers,
    origin: originCity === "other" ? originCityOther : answerLabel("origin_city", originCity),
    travelHelp: answerLabel("travel_help", travelHelp),
    answers: Object.entries(answers).map(
      ([id, value]) => [questionLabel(id), answerLabel(id, value)] as [string, string]
    ),
    dealBreakers,
    notes,
    promoCode: effectivePromo?.code ?? null,
    promoLabel: effectivePromo?.label ?? null,
    subtotal: subtotal !== null ? formatINR(subtotal) : null,
    discount: effectiveDiscount > 0 ? formatINR(effectiveDiscount) : null,
    total: effectiveTotal !== null ? formatINR(effectiveTotal) : null,
  };

  // Email is best-effort — the request is already safely stored.
  const alert = tripRequestAlertEmail(payload);
  const ack = tripRequestAcknowledgementEmail(payload);
  await Promise.allSettled([
    sendEmail({ to: site.opsEmail, subject: alert.subject, html: alert.html, replyTo: email }),
    sendEmail({ to: email, subject: ack.subject, html: ack.html, replyTo: site.email }),
  ]);

  return NextResponse.json({
    ok: true,
    requestId: inserted.id,
    // The server's figures, so the "sent" screen quotes what was actually
    // stored rather than what the browser last believed.
    subtotal,
    discountAmount: effectiveDiscount,
    total: effectiveTotal,
    promoCode: effectivePromo?.code ?? null,
  });
}
