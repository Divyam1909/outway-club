"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { format } from "date-fns";
import { Check } from "lucide-react";
import { formatINR, seatsLeft } from "@/lib/utils";
import type { Departure } from "@/lib/types";

/** Below this many seats, the row says so out loud rather than just counting. */
const FILLING_FAST_AT = 4;
/** Rows shown before the list collapses behind a "show all" toggle. */
const VISIBLE_ROWS = 4;

/**
 * Every date this escape runs, on the page.
 *
 * This replaces a `<select>` that hid the answer to the question people
 * actually arrive with — *when* can I go. A trip running four weekends now
 * reads as four chances to go rather than one ambiguous listing, and a row
 * that's gone is visibly gone instead of being an option you can't pick.
 *
 * It's a radio group underneath: real inputs, real labels, arrow keys, and a
 * focus ring on the row rather than on an invisible dot.
 */
export function DepartureBoard({
  departures,
  selectedId,
  onSelect,
  /** Distinguishes the sidebar group from any other on the page. */
  name = "departure",
  fallbackPrice,
}: {
  departures: Departure[];
  selectedId: string;
  onSelect: (id: string) => void;
  name?: string;
  fallbackPrice: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const shown = expanded ? departures : departures.slice(0, VISIBLE_ROWS);
  const hidden = departures.length - shown.length;

  return (
    <fieldset>
      <legend className="field-label">
        {departures.length === 1
          ? "Departure date"
          : `${departures.length} dates open — pick one`}
      </legend>

      <div className="space-y-2">
        {shown.map((departure) => {
          const left = seatsLeft(departure.total_seats, departure.seats_booked);
          const soldOut = departure.status === "sold_out" || left === 0;
          const fillingFast = !soldOut && left <= FILLING_FAST_AT;
          const selected = departure.id === selectedId;
          const price = departure.price_override ?? fallbackPrice;

          return (
            <label
              key={departure.id}
              className={clsx(
                "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-3 transition-colors",
                "focus-within:ring-2 focus-within:ring-clay focus-within:ring-offset-0",
                soldOut && "cursor-not-allowed border-border bg-cream-300 opacity-70",
                !soldOut && selected && "border-pine bg-pine-50",
                !soldOut && !selected && "border-border-control bg-white hover:border-pine"
              )}
            >
              <input
                type="radio"
                name={name}
                value={departure.id}
                checked={selected}
                disabled={soldOut}
                onChange={() => onSelect(departure.id)}
                className="sr-only"
              />

              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  {selected && !soldOut && (
                    <Check size={15} className="shrink-0 text-pine" aria-hidden="true" />
                  )}
                  <span
                    className={clsx(
                      "text-sm font-semibold",
                      soldOut ? "text-ink-500 line-through" : "text-ink"
                    )}
                  >
                    {format(new Date(departure.start_date), "d MMM")} –{" "}
                    {format(new Date(departure.end_date), "d MMM yyyy")}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-ink-500">
                  {format(new Date(departure.start_date), "EEEE")} start ·{" "}
                  {soldOut ? (
                    "Sold out"
                  ) : fillingFast ? (
                    <span className="font-semibold text-clay">Only {left} seats left</span>
                  ) : (
                    `${left} of ${departure.total_seats} seats left`
                  )}
                </span>
              </span>

              <span className="shrink-0 text-right">
                <span className="block text-sm font-semibold text-ink">{formatINR(price)}</span>
                <span className="block text-[11px] text-ink-500">per person</span>
              </span>
            </label>
          );
        })}
      </div>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2.5 text-sm font-medium text-pine underline underline-offset-2 hover:text-pine-600"
        >
          Show {hidden} more {hidden === 1 ? "date" : "dates"}
        </button>
      )}
    </fieldset>
  );
}
