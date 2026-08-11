import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayInstance, isRazorpayConfigured } from "@/lib/razorpay";
import { RATE_LIMITS, TOO_MANY_REQUESTS, rateLimitRequest } from "@/lib/rate-limit";
import { seatsLeft } from "@/lib/utils";

export async function POST(request: Request) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { error: "Payments aren't switched on yet. Please email us and we'll book you in manually." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You need to be signed in to book." }, { status: 401 });
  }

  // Rate limited per user as well as per IP: creating orders is cheap for a
  // caller but costs us a Razorpay API call every time.
  if (!(await rateLimitRequest(RATE_LIMITS.createOrder, request, user.id))) {
    return NextResponse.json(TOO_MANY_REQUESTS, { status: 429 });
  }

  let body: { tripId?: string; departureId?: string | null; numTravelers?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { tripId, departureId = null } = body;
  const numTravelers = Number(body.numTravelers);

  if (!tripId || !Number.isInteger(numTravelers) || numTravelers < 1 || numTravelers > 20) {
    return NextResponse.json({ error: "Invalid booking request." }, { status: 400 });
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, price_per_person, discounted_price, group_size_max, is_published")
    .eq("id", tripId)
    .single();

  if (tripError || !trip || !trip.is_published) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  if (numTravelers > trip.group_size_max) {
    return NextResponse.json(
      { error: `This trip takes a maximum of ${trip.group_size_max} travellers.` },
      { status: 400 }
    );
  }

  let pricePerPerson = Number(trip.discounted_price ?? trip.price_per_person);

  if (departureId) {
    const { data: departure, error: departureError } = await supabase
      .from("departures")
      .select("id, total_seats, seats_booked, price_override, status, start_date")
      .eq("id", departureId)
      .single();

    if (departureError || !departure) {
      return NextResponse.json({ error: "Departure not found." }, { status: 404 });
    }
    if (departure.status === "sold_out" || departure.status === "closed") {
      return NextResponse.json({ error: "This departure is no longer available." }, { status: 409 });
    }
    if (new Date(departure.start_date) < new Date(new Date().toDateString())) {
      return NextResponse.json({ error: "This departure has already left." }, { status: 409 });
    }
    if (numTravelers > seatsLeft(departure.total_seats, departure.seats_booked)) {
      return NextResponse.json({ error: "Not enough seats left on this departure." }, { status: 409 });
    }
    if (departure.price_override) pricePerPerson = Number(departure.price_override);
  }

  const totalAmount = pricePerPerson * numTravelers;

  try {
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `trip_${tripId.slice(0, 8)}_${Date.now()}`,
      // These notes are the record of what was actually sold. Confirmation
      // reads the sale back out of them rather than trusting the browser —
      // see recordPaidBooking in src/lib/bookings.ts.
      notes: {
        tripId,
        departureId: departureId ?? "",
        userId: user.id,
        numTravelers: String(numTravelers),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: totalAmount,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[create-order] Razorpay order creation failed:", error);
    return NextResponse.json(
      { error: "Couldn't reach the payment gateway. Please try again in a moment." },
      { status: 502 }
    );
  }
}
