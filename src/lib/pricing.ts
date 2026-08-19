import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * What an order is worth, decided on the server.
 *
 * Every endpoint that stores or quotes a price goes through this, and none of
 * them accept a price from the request body. The browser sends a trip, a date
 * and a headcount — three things the customer chose — and the money is derived
 * here from the rows those three point at.
 *
 * The precedence is the same one the booking widget shows, and it has to stay
 * that way or the page and the quote disagree: a departure's `price_override`
 * beats the trip's `discounted_price`, which beats `price_per_person`.
 */
export interface OrderPricing {
  tripId: string;
  tripTitle: string;
  tripSlug: string;
  pricePerPerson: number;
  /** The trip's undiscounted list price, for the struck-through number. */
  listPricePerPerson: number;
  travelers: number;
  subtotal: number;
}

export async function priceOrder({
  tripId,
  departureId,
  travelers,
}: {
  tripId: string;
  departureId?: string | null;
  travelers: number;
}): Promise<OrderPricing | null> {
  const admin = createAdminClient();

  const { data: trip } = await admin
    .from("trips")
    .select("id, slug, title, price_per_person, discounted_price, group_size_max")
    .eq("id", tripId)
    .maybeSingle();

  if (!trip) return null;

  let pricePerPerson = Number(trip.discounted_price ?? trip.price_per_person);

  if (departureId) {
    const { data: departure } = await admin
      .from("departures")
      .select("id, trip_id, price_override")
      .eq("id", departureId)
      .maybeSingle();

    // A departure id belonging to a different trip is either a stale tab or
    // someone poking at the payload; either way it must not set the price.
    if (departure && departure.trip_id === trip.id && departure.price_override !== null) {
      pricePerPerson = Number(departure.price_override);
    }
  }

  const headcount = Math.max(1, Math.min(Math.round(travelers) || 1, 40));

  return {
    tripId: trip.id,
    tripTitle: trip.title as string,
    tripSlug: trip.slug as string,
    pricePerPerson,
    listPricePerPerson: Number(trip.price_per_person),
    travelers: headcount,
    subtotal: pricePerPerson * headcount,
  };
}
