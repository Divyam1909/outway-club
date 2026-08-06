import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { seatsLeft } from "@/lib/utils";

interface VerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  tripId: string;
  departureId: string | null;
  numTravelers: number;
  travelers: { full_name: string; age?: number; gender?: string }[];
  specialRequests?: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You need to be signed in to book." }, { status: 401 });
  }

  const payload = (await request.json()) as VerifyPayload;
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    tripId,
    departureId,
    numTravelers,
    travelers,
    specialRequests,
  } = payload;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: trip, error: tripError } = await admin
    .from("trips")
    .select("id, price_per_person, discounted_price")
    .eq("id", tripId)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  let pricePerPerson = trip.discounted_price ?? trip.price_per_person;
  let departure = null;

  if (departureId) {
    const { data, error } = await admin
      .from("departures")
      .select("*")
      .eq("id", departureId)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "Departure not found." }, { status: 404 });
    }
    departure = data;
    if (departure.price_override) pricePerPerson = departure.price_override;
  }

  const totalAmount = pricePerPerson * numTravelers;

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .insert({
      user_id: user.id,
      trip_id: tripId,
      departure_id: departureId,
      num_travelers: numTravelers,
      total_amount: totalAmount,
      status: "confirmed",
      payment_status: "paid",
      razorpay_order_id,
      razorpay_payment_id,
      special_requests: specialRequests || null,
    })
    .select()
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Could not create booking." }, { status: 500 });
  }

  if (travelers?.length) {
    await admin.from("travelers").insert(
      travelers.map((traveler, index) => ({
        booking_id: booking.id,
        full_name: traveler.full_name,
        age: traveler.age ?? null,
        gender: traveler.gender ?? null,
        is_primary: index === 0,
      }))
    );
  }

  if (departure) {
    const seatsRemaining = seatsLeft(departure.total_seats, departure.seats_booked);
    await admin
      .from("departures")
      .update({ seats_booked: departure.seats_booked + Math.min(numTravelers, seatsRemaining) })
      .eq("id", departure.id);
  }

  return NextResponse.json({ bookingId: booking.id });
}
