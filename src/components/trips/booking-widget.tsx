"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DepartureBoard } from "@/components/trips/departure-board";
import { EnquiryLinks } from "@/components/trips/enquiry-links";
import { TrustPoints } from "@/components/trips/trust-points";
import { Stepper } from "@/components/ui/stepper";
import { formatINR, seatsLeft } from "@/lib/utils";
import type { Departure, Trip } from "@/lib/types";

/**
 * Two ways out of this box, not one.
 *
 * "Book now" opens the two-minute questionnaire (no payment behind it while
 * that's off), and "Enquire" goes to the contact form for the people who just
 * want to ask something first. They sit side by side at the same size on
 * purpose: asking a question is not a lesser action than booking, and burying
 * it as a footnote is how a lead turns into a bounce.
 */
export function BookingWidget({
  trip,
  departures,
}: {
  trip: Pick<
    Trip,
    | "id"
    | "slug"
    | "title"
    | "price_per_person"
    | "discounted_price"
    | "is_group_trip"
    | "trip_type"
    | "group_size_max"
  >;
  departures: Departure[];
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
  const isFixedDeparture = trip.trip_type === "group";

  /** The questionnaire — it carries the date and headcount picked here. */
  function goToRequestForm() {
    const params = new URLSearchParams({ travelers: String(travelers) });
    if (departureId) params.set("departureId", departureId);
    router.push(`/booking/${trip.slug}?${params.toString()}`);
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
      <p className="text-xs text-ink-500">per person, taxes in</p>

      {/* Against the number, not at the foot of the card: the doubt these
          answer arrives while someone is reading the price. */}
      <TrustPoints align="start" className="mb-6 mt-4 border-y border-border py-4" />

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

      {!noDepartures && isFixedDeparture && (
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
          <Link href={`/contact?trip=${trip.slug}`} className="btn-primary w-full">
            Notify me
          </Link>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={goToRequestForm} className="btn-accent w-full px-3">
            {isFixedDeparture ? "Book now" : "Request dates"}
          </button>
          <Link href={`/contact?trip=${trip.slug}`} className="btn-outline w-full px-3">
            Enquire
          </Link>
        </div>
      )}

      {!noDepartures && (
        <p className="mt-3 text-center text-xs leading-relaxed text-ink-500">
          Booking starts with a two-minute form. Nothing is charged there — we confirm your seat
          first.
        </p>
      )}

      {/* No TrustBand here any more: both lines it carried — "nothing is
          charged" and "the total is the total" — are now said above, once, by
          the trust points and the note under the buttons. */}
      <EnquiryLinks
        tripSlug={trip.slug}
        tripTitle={trip.title}
        align="center"
        className="mt-4 border-t border-border pt-4"
      />
    </div>
  );
}
