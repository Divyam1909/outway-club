import { Calendar, Users } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { formatINR, formatDateRange } from "@/lib/utils";
import type { Departure, Trip } from "@/lib/types";

export function OrderSummary({
  trip,
  departure,
  pricePerPerson,
  travelersCount,
}: {
  trip: Pick<Trip, "title" | "hero_image" | "duration_days" | "duration_nights">;
  departure: Departure | null;
  pricePerPerson: number;
  travelersCount: number;
}) {
  const total = pricePerPerson * travelersCount;

  return (
    <div className="rounded-3xl border border-border bg-white p-6 shadow-card lg:sticky lg:top-24">
      <div className="flex gap-3">
        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl">
          <SmartImage src={trip.hero_image} alt={trip.title} fill sizes="80px" className="object-cover" />
        </div>
        <div>
          <p className="font-display text-base font-semibold leading-snug text-ink">{trip.title}</p>
          <p className="text-xs text-ink-400">
            {trip.duration_days} days / {trip.duration_nights} nights
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
        {departure && (
          <div className="flex items-center justify-between text-ink-500">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> Departure
            </span>
            <span className="font-medium text-ink-700">
              {formatDateRange(departure.start_date, departure.end_date)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-ink-500">
          <span className="flex items-center gap-1.5">
            <Users size={14} /> Travelers
          </span>
          <span className="font-medium text-ink-700">{travelersCount}</span>
        </div>
        <div className="flex items-center justify-between text-ink-500">
          <span>Price per person</span>
          <span className="font-medium text-ink-700">{formatINR(pricePerPerson)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="font-semibold text-ink">Total</span>
        <span className="font-display text-2xl font-semibold text-ink">{formatINR(total)}</span>
      </div>
    </div>
  );
}
