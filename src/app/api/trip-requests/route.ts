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
import { formatDateRange } from "@/lib/utils";
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
  const departureId = typeof body.departureId === "string" && body.departureId ? body.departureId : null;

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
    })
    .select("id")
    .single();

  if (error) {
    console.error("[trip-requests] insert failed:", error.message);
    return NextResponse.json(
      { error: "We couldn't save that just now. Please try again in a moment." },
      { status: 500 }
    );
  }

  // Dates are only quoted back if the departure still exists.
  let dateRange: string | null = null;
  if (departureId) {
    const { data: departure } = await admin
      .from("departures")
      .select("start_date, end_date")
      .eq("id", departureId)
      .maybeSingle();
    if (departure) dateRange = formatDateRange(departure.start_date, departure.end_date);
  }

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
  };

  // Email is best-effort — the request is already safely stored.
  const alert = tripRequestAlertEmail(payload);
  const ack = tripRequestAcknowledgementEmail(payload);
  await Promise.allSettled([
    sendEmail({ to: site.opsEmail, subject: alert.subject, html: alert.html, replyTo: email }),
    sendEmail({ to: email, subject: ack.subject, html: ack.html, replyTo: site.email }),
  ]);

  return NextResponse.json({ ok: true, requestId: inserted.id });
}
