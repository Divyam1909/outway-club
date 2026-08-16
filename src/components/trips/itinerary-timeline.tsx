import { Coffee, Utensils, Moon, Home, MapPin } from "lucide-react";
import { TIMINGS_NOTE } from "@/config/trip-request";
import { ItineraryDescription } from "@/components/trips/itinerary-description";
import type { ItineraryDay } from "@/lib/types";

/**
 * Anything that looks like a clock time at the head of an activity —
 * "5:30 PM — Sunset boat…", "7 AM depart" — so it can be marked with an
 * asterisk. Written against how the itinerary is actually authored: a time,
 * then a separator, then the activity.
 */
const LEADING_TIME = /^\s*(\d{1,2}([:.]\d{2})?\s*(am|pm|AM|PM)|\d{1,2}[:.]\d{2})\b/;

/** The same idea, anywhere in a sentence: "out by 7am", "the 7pm show". */
const TIME_IN_PROSE = /\b\d{1,2}([:.]\d{2})?\s?(am|pm)\b/i;

function hasTime(activity: string): boolean {
  return LEADING_TIME.test(activity);
}

export function ItineraryTimeline({ days }: { days: ItineraryDay[] }) {
  // Only footnote what's actually on screen. A day-by-day with no clock times
  // in it shouldn't carry a disclaimer about clock times.
  const anyTimings = days.some(
    (day) => day.activities.some(hasTime) || TIME_IN_PROSE.test(day.description)
  );

  return (
    <>
      <ol className="relative border-l border-border pl-8">
        {days.map((day) => (
          <li key={day.id} className="mb-10 last:mb-0">
            <span className="absolute -left-[1.15rem] flex h-9 w-9 items-center justify-center rounded-full bg-pine heading-sm text-sm text-cream-100">
              {day.day_number}
            </span>

            <h3 className="heading-sm text-lg text-ink">{day.title}</h3>
            <ItineraryDescription text={day.description} />

            {day.activities.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {day.activities.map((activity) => (
                  <li
                    key={activity}
                    className="flex items-center gap-1.5 rounded-full bg-cream-300 px-3 py-1.5 text-xs text-ink-700"
                  >
                    <MapPin size={12} className="text-clay" />
                    {activity}
                    {hasTime(activity) && (
                      <span aria-hidden="true" className="font-semibold text-clay">
                        *
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-500">
              <span className="flex items-center gap-1">
                <Coffee size={13} className={day.meals.breakfast ? "text-pine" : "text-ink-200"} />
                Breakfast {day.meals.breakfast ? "included" : "not included"}
              </span>
              <span className="flex items-center gap-1">
                <Utensils size={13} className={day.meals.lunch ? "text-pine" : "text-ink-200"} />
                Lunch {day.meals.lunch ? "included" : "not included"}
              </span>
              <span className="flex items-center gap-1">
                <Moon size={13} className={day.meals.dinner ? "text-pine" : "text-ink-200"} />
                Dinner {day.meals.dinner ? "included" : "not included"}
              </span>
              {day.accommodation && (
                <span className="flex items-center gap-1">
                  <Home size={13} className="text-pine" />
                  {day.accommodation}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>

      {anyTimings && (
        <p className="mt-6 rounded-xl bg-cream-300 px-4 py-3 text-xs leading-relaxed text-ink-500">
          <span aria-hidden="true" className="font-semibold text-clay">
            *
          </span>{" "}
          {TIMINGS_NOTE} The order of the days and everything included in them stays as written.
        </p>
      )}
    </>
  );
}
