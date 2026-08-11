"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DepartureBoard } from "@/components/trips/departure-board";
import { TrustBand } from "@/components/trips/trust-band";
import { Stepper } from "@/components/ui/stepper";
import { formatINR, seatsLeft } from "@/lib/utils";
import type { Departure, Trip } from "@/lib/types";

export function BookingWidget({
  trip,
  departures,
  isSignedIn,
}: {
  trip: Pick<Trip, "id" | "slug" | "price_per_person" | "discounted_price" | "is_group_trip" | "trip_type" | "group_size_max">;
  departures: Departure[];
  isSignedIn: boolean;
}) {
  const router = useRouter();
  // Default to the first date that can still be booked rather than simply the
  // first row: landing on a sold-out departure makes the widget look broken.
  const [departureId, setDepartureId] = useState(
    () =>
      departures.find(
        (d) => d.status !== "sold_out" && seatsLeft(d.total_seats, d.seats_booked) > 0
      )?.id ??
      departures[0]?.id ??
      ""
  );
  const [travelers, setTravelers] = useState(1);

  const selectedDeparture = departures.find((d) => d.id === departureId);
  const basePrice = trip.discounted_price ?? trip.price_per_person;
  const pricePerPerson = selectedDeparture?.price_override ?? basePrice;
  const maxTravelers = useMemo(() => {
    if (!trip.is_group_trip) return trip.group_size_max;
    if (!selectedDeparture) return trip.group_size_max;
    return Math.max(1, Math.min(trip.group_size_max, seatsLeft(selectedDeparture.total_seats, selectedDeparture.seats_booked)));
  }, [selectedDeparture, trip.group_size_max, trip.is_group_trip]);

  const total = pricePerPerson * travelers;
  const canBookDirectly = trip.trip_type === "group";

  function handleCta() {
    if (canBookDirectly) {
      const params = new URLSearchParams({ travelers: String(travelers) });
      if (departureId) params.set("departureId", departureId);
      const target = `/booking/${trip.slug}?${params.toString()}`;
      router.push(isSignedIn ? target : `/login?redirect=${encodeURIComponent(target)}`);
    } else {
      router.push(`/contact?trip=${trip.slug}`);
    }
  }

  const noDepartures = trip.is_group_trip && departures.length === 0;
  const hasDiscount = Boolean(
    trip.discounted_price && trip.discounted_price < trip.price_per_person
  );

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-card lg:sticky lg:top-20">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold text-ink">
          {formatINR(pricePerPerson)}
        </span>
        {hasDiscount && (
          <span className="text-sm text-ink-400 line-through">
            {formatINR(trip.price_per_person)}
          </span>
        )}
      </div>
      <p className="mb-6 text-xs text-ink-500">per person, taxes in</p>

      {trip.is_group_trip && departures.length > 0 && (
        <div className="mb-5">
          <DepartureBoard
            departures={departures}
            selectedId={departureId}
            onSelect={(id) => {
              setDepartureId(id);
              setTravelers(1);
            }}
            fallbackPrice={basePrice}
          />
        </div>
      )}

      {!noDepartures && (
        <div className="mb-6">
          <Stepper
            label="Travellers"
            value={travelers}
            max={maxTravelers}
            onChange={setTravelers}
            decrementLabel="One traveller fewer"
            incrementLabel="One traveller more"
            hint={
              maxTravelers > 1 && travelers >= maxTravelers
                ? `${maxTravelers} is everything left on this date.`
                : undefined
            }
          />
        </div>
      )}

      {!noDepartures && canBookDirectly && (
        <div className="mb-5 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-ink-500">
            {formatINR(pricePerPerson)} &times; {travelers}
          </span>
          <output aria-live="polite" className="heading-sm text-lg text-ink">
            {formatINR(total)}
          </output>
        </div>
      )}

      {noDepartures ? (
        <>
          <p className="mb-3 text-sm text-ink-500">
            No upcoming departures right now. Enquire and we&apos;ll let you know as soon as new
            dates open.
          </p>
          <button onClick={() => router.push(`/contact?trip=${trip.slug}`)} className="btn-primary w-full">
            Notify me
          </button>
        </>
      ) : (
        <button onClick={handleCta} className="btn-accent btn-lg w-full">
          {canBookDirectly ? "Book now" : "Enquire to customize"}
        </button>
      )}

      <TrustBand variant="compact" className="mt-4" />
    </div>
  );
}
