"use client";

import { useState } from "react";
import { BookingForm } from "@/components/booking/booking-form";
import { OrderSummary } from "@/components/booking/order-summary";
import type { Departure, Trip } from "@/lib/types";

/**
 * Owns the one piece of state the checkout screen shares: how many people are
 * going. The summary edits it, the form's traveller boxes follow it, and both
 * halves quote the same total — which they couldn't when each read the
 * `travelers` query parameter independently and neither could change it.
 */
export function BookingPanel({
  trip,
  departure,
  pricePerPerson,
  initialTravelers,
  maxTravelers,
  prefillName,
  prefillEmail,
}: {
  trip: Pick<
    Trip,
    "id" | "title" | "hero_image" | "duration_days" | "duration_nights"
  >;
  departure: Departure | null;
  pricePerPerson: number;
  initialTravelers: number;
  maxTravelers: number;
  prefillName: string;
  prefillEmail: string;
}) {
  const [travelersCount, setTravelersCount] = useState(
    Math.min(Math.max(initialTravelers, 1), maxTravelers)
  );

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_1fr]">
      <BookingForm
        tripId={trip.id}
        tripTitle={trip.title}
        departureId={departure?.id ?? null}
        pricePerPerson={pricePerPerson}
        travelersCount={travelersCount}
        prefillName={prefillName}
        prefillEmail={prefillEmail}
      />
      <OrderSummary
        trip={trip}
        departure={departure}
        pricePerPerson={pricePerPerson}
        travelersCount={travelersCount}
        maxTravelers={maxTravelers}
        onTravelersChange={setTravelersCount}
      />
    </div>
  );
}
