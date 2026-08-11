"use client";

import { Calendar } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Stepper } from "@/components/ui/stepper";
import { formatINR, formatDateRange } from "@/lib/utils";
import type { Departure, Trip } from "@/lib/types";

/**
 * The summary is where people check their own work, so the one number they're
 * most likely to want to change is editable here rather than locked to the
 * `travelers` query parameter they arrived with. Getting it wrong used to mean
 * going back to the trip page and starting the flow again.
 */
export function OrderSummary({
  trip,
  departure,
  pricePerPerson,
  travelersCount,
  maxTravelers,
  onTravelersChange,
}: {
  trip: Pick<Trip, "title" | "hero_image" | "duration_days" | "duration_nights">;
  departure: Departure | null;
  pricePerPerson: number;
  travelersCount: number;
  maxTravelers: number;
  onTravelersChange: (next: number) => void;
}) {
  const total = pricePerPerson * travelersCount;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-card lg:sticky lg:top-20">
      <div className="flex gap-3">
        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl">
          <SmartImage src={trip.hero_image} alt={trip.title} fill sizes="80px" className="object-cover" />
        </div>
        <div>
          <p className="heading-sm text-base leading-snug text-ink">{trip.title}</p>
          <p className="text-xs text-ink-500">
            {trip.duration_days} days / {trip.duration_nights} nights
          </p>
        </div>
      </div>

      {departure && (
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm text-ink-500">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} aria-hidden="true" /> Departure
          </span>
          <span className="font-medium text-ink-700">
            {formatDateRange(departure.start_date, departure.end_date)}
          </span>
        </div>
      )}

      <div className="mt-4">
        <Stepper
          label="Travellers"
          value={travelersCount}
          max={maxTravelers}
          onChange={onTravelersChange}
          decrementLabel="One traveller fewer"
          incrementLabel="One traveller more"
          hint={
            travelersCount >= maxTravelers && maxTravelers > 1
              ? `${maxTravelers} is everything left on this date.`
              : "Change this and the traveller boxes on the left follow."
          }
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm text-ink-500">
        <span>Price per person</span>
        <span className="font-medium text-ink-700">{formatINR(pricePerPerson)}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="font-semibold text-ink">Total</span>
        <output aria-live="polite" className="font-display text-2xl font-semibold text-ink">
          {formatINR(total)}
        </output>
      </div>
    </div>
  );
}
