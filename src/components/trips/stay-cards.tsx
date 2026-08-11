import { BedDouble, CheckCircle2 } from "lucide-react";
import type { ItineraryDay } from "@/lib/types";

/**
 * Where you actually sleep, by name.
 *
 * The itinerary already carried this on every day, buried in a row of grey
 * meta icons under the description — which is the one line a reader scans for
 * and the hardest one to find. Consecutive nights in the same place collapse
 * into a single card, so a three-day trip reads as "two nights here" rather
 * than the same hotel printed twice.
 */

type Stay = { name: string; nights: number; firstDay: number; lastDay: number };

function groupStays(days: ItineraryDay[]): Stay[] {
  const stays: Stay[] = [];

  for (const day of days) {
    const name = day.accommodation?.trim();
    if (!name) continue;

    const previous = stays[stays.length - 1];
    if (previous && previous.name === name && previous.lastDay === day.day_number - 1) {
      previous.nights += 1;
      previous.lastDay = day.day_number;
      continue;
    }

    stays.push({ name, nights: 1, firstDay: day.day_number, lastDay: day.day_number });
  }

  return stays;
}

export function StayCards({ days }: { days: ItineraryDay[] }) {
  const stays = groupStays(days);
  if (stays.length === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stays.map((stay) => (
          <div
            key={`${stay.name}-${stay.firstDay}`}
            className="flex items-start gap-3.5 rounded-2xl border border-border bg-white p-5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine-50 text-pine">
              <BedDouble size={19} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="heading-sm text-base leading-snug text-ink">{stay.name}</p>
              <p className="mt-1 text-sm text-ink-500">
                {stay.nights} {stay.nights === 1 ? "night" : "nights"} ·{" "}
                {stay.firstDay === stay.lastDay
                  ? `Day ${stay.firstDay}`
                  : `Days ${stay.firstDay} to ${stay.lastDay}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-ink-500">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-pine" aria-hidden="true" />
        Every one of these is booked and paid for before the date goes on sale. If a property lets
        us down we move you to the same standard or better, and tell you before you travel.
      </p>
    </div>
  );
}
