"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ShieldCheck } from "lucide-react";
import { formatINR, formatDateRange, seatsLeft } from "@/lib/utils";
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
  const [departureId, setDepartureId] = useState(departures[0]?.id ?? "");
  const [travelers, setTravelers] = useState(1);

  const selectedDeparture = departures.find((d) => d.id === departureId);
  const pricePerPerson =
    selectedDeparture?.price_override ?? trip.discounted_price ?? trip.price_per_person;
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

  return (
    <div className="rounded-3xl border border-border bg-white p-6 shadow-card lg:sticky lg:top-24">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold text-ink">
          {formatINR(pricePerPerson)}
        </span>
        {trip.discounted_price && trip.discounted_price < trip.price_per_person && (
          <span className="text-sm text-ink-300 line-through">
            {formatINR(trip.price_per_person)}
          </span>
        )}
      </div>
      <p className="mb-6 text-xs text-ink-400">per person</p>

      {trip.is_group_trip && departures.length > 0 && (
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Departure date</label>
          <select
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm focus:border-pine focus:outline-none"
            value={departureId}
            onChange={(e) => {
              setDepartureId(e.target.value);
              setTravelers(1);
            }}
          >
            {departures.map((d) => (
              <option key={d.id} value={d.id} disabled={d.status === "sold_out"}>
                {formatDateRange(d.start_date, d.end_date)} ·{" "}
                {d.status === "sold_out" ? "Sold out" : `${seatsLeft(d.total_seats, d.seats_booked)} seats left`}
              </option>
            ))}
          </select>
        </div>
      )}

      {!noDepartures && (
        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Travelers</label>
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
            <span className="flex items-center gap-2 text-sm text-ink-700">
              <Users size={16} /> Guests
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-ink-500 hover:border-pine hover:text-pine"
              >
                −
              </button>
              <span className="w-4 text-center text-sm font-medium">{travelers}</span>
              <button
                type="button"
                onClick={() => setTravelers((t) => Math.min(maxTravelers, t + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-ink-500 hover:border-pine hover:text-pine"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {!noDepartures && canBookDirectly && (
        <div className="mb-5 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-ink-500">
            {formatINR(pricePerPerson)} &times; {travelers}
          </span>
          <span className="font-display text-lg font-semibold text-ink">{formatINR(total)}</span>
        </div>
      )}

      {noDepartures ? (
        <>
          <p className="mb-3 text-sm text-ink-500">
            No upcoming departures right now. Enquire and we&apos;ll let you know as soon as new
            dates open.
          </p>
          <button onClick={() => router.push(`/contact?trip=${trip.slug}`)} className="btn-accent w-full">
            Notify me
          </button>
        </>
      ) : (
        <button onClick={handleCta} className="btn-accent w-full py-3.5 text-base">
          {canBookDirectly ? "Book now" : "Enquire to customize"}
        </button>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-400">
        <ShieldCheck size={14} className="text-pine" /> Secure checkout · No hidden charges
      </p>
    </div>
  );
}
