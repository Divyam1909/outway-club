import { Coffee, Utensils, Moon, Home, MapPin } from "lucide-react";
import type { ItineraryDay } from "@/lib/types";

export function ItineraryTimeline({ days }: { days: ItineraryDay[] }) {
  return (
    <ol className="relative border-l border-border pl-8">
      {days.map((day) => (
        <li key={day.id} className="mb-10 last:mb-0">
          <span className="absolute -left-[1.15rem] flex h-9 w-9 items-center justify-center rounded-full bg-pine font-display text-sm font-semibold text-cream-100">
            {day.day_number}
          </span>

          <h3 className="font-display text-lg font-semibold text-ink">{day.title}</h3>
          <p className="mt-2 leading-relaxed text-ink-500">{day.description}</p>

          {day.activities.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {day.activities.map((activity) => (
                <li
                  key={activity}
                  className="flex items-center gap-1.5 rounded-full bg-cream-300 px-3 py-1.5 text-xs text-ink-700"
                >
                  <MapPin size={12} className="text-clay" />
                  {activity}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-400">
            <span className="flex items-center gap-1">
              <Coffee size={13} className={day.meals.breakfast ? "text-pine" : "text-ink-300"} />
              Breakfast {day.meals.breakfast ? "included" : "not included"}
            </span>
            <span className="flex items-center gap-1">
              <Utensils size={13} className={day.meals.lunch ? "text-pine" : "text-ink-300"} />
              Lunch {day.meals.lunch ? "included" : "not included"}
            </span>
            <span className="flex items-center gap-1">
              <Moon size={13} className={day.meals.dinner ? "text-pine" : "text-ink-300"} />
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
  );
}
