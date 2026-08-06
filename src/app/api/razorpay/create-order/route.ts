import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayInstance } from "@/lib/razorpay";
import { seatsLeft } from "@/lib/utils";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You need to be signed in to book." }, { status: 401 });
  }

  const body = await request.json();
  const { tripId, departureId, numTravelers } = body as {
    tripId: string;
    departureId: string | null;
    numTravelers: number;
  };

  if (!tripId || !numTravelers || numTravelers < 1) {
    return NextResponse.json({ error: "Invalid booking request." }, { status: 400 });
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, price_per_person, discounted_price, group_size_max")
    .eq("id", tripId)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  let pricePerPerson = trip.discounted_price ?? trip.price_per_person;

  if (departureId) {
    const { data: departure, error: departureError } = await supabase
      .from("departures")
      .select("id, total_seats, seats_booked, price_override, status")
      .eq("id", departureId)
      .single();

    if (departureError || !departure) {
      return NextResponse.json({ error: "Departure not found." }, { status: 404 });
    }
    if (departure.status === "sold_out" || departure.status === "closed") {
      return NextResponse.json({ error: "This departure is no longer available." }, { status: 409 });
    }
    if (numTravelers > seatsLeft(departure.total_seats, departure.seats_booked)) {
      return NextResponse.json({ error: "Not enough seats left on this departure." }, { status: 409 });
    }
    if (departure.price_override) pricePerPerson = departure.price_override;
  }

  const totalAmount = pricePerPerson * numTravelers;

  const razorpay = getRazorpayInstance();
  const order = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100),
    currency: "INR",
    receipt: `trip_${tripId.slice(0, 8)}_${Date.now()}`,
    notes: { tripId, departureId: departureId ?? "", userId: user.id },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: totalAmount,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
