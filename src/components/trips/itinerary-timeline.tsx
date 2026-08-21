import { Coffee, Utensils, Moon, Home } from "lucide-react";
import { ExpandableProse } from "@/components/trips/expandable-prose";
import { TIMINGS_NOTE_SHORT } from "@/config/trip-request";
import { splitActivity } from "@/lib/utils";
import type { ItineraryDay } from "@/lib/types";

/**
 * "Your Journey", day by day.
 *
 * Activities are authored as `Band (exact time) — What happens` and this
 * renders only the band. That is a deliberate brand rule, not an oversight:
 * the customer-facing journey shows the experience, and the operational clock
 * lives in the ops sheet and the brochure. A day that reads "Late afternoon —
 * open jeep with a naturalist" is also a day we can run honestly when the
 * light, the weather or the road disagrees with a printed 4:00 PM.
 *
 * Days are numbered from whatever the data says, zero-padded. An escape that
 * starts on a platform in Delhi the night before has a Day 00, and calling it
 * Day 1 would quietly move the meeting point a night later in the reader's
 * head.
 */
export function ItineraryTimeline({ days }: { days: ItineraryDay[] }) {
  return (
    <>
      <ol className="relative border-l border-border pl-8">
        {days.map((day) => (
          <li key={day.id} className="mb-10 last:mb-0">
            <span className="absolute -left-[1.15rem] flex h-9 w-9 items-center justify-center rounded-full bg-pine heading-sm text-xs text-cream-100">
              {String(day.day_number).padStart(2, "0")}
            </span>

            <h3 className="heading-sm text-lg text-ink">{day.title}</h3>
            <ExpandableProse text={day.description} />

            {day.activities.length > 0 && (
              <dl className="mt-4 space-y-2.5 border-l-2 border-cream-300 pl-4">
                {day.activities.map((activity) => {
                  const { band, label } = splitActivity(activity);
                  return (
                    <div key={activity} className="sm:flex sm:gap-4">
                      {band && (
                        <dt className="shrink-0 text-xs font-semibold uppercase tracking-[0.1em] text-clay sm:w-36 sm:pt-0.5">
                          {band}
                        </dt>
                      )}
                      <dd
                        className={`text-sm leading-relaxed text-ink-700 ${band ? "" : "sm:ml-40"}`}
                      >
                        {label}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink-500">
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

      <p className="mt-6 rounded-xl bg-cream-300 px-4 py-3 text-xs leading-relaxed text-ink-500">
        {TIMINGS_NOTE_SHORT} We plan to the hour internally and publish the shape of the day
        instead, because light, weather and local conditions get a vote. The order of the days,
        and everything included in them, stays exactly as written. Exact timings come with your
        joining note and the downloadable brochure.
      </p>
    </>
  );
}
