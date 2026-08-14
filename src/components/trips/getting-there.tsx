import Link from "next/link";
import { ArrowRight, PlaneTakeoff, TrainFront } from "lucide-react";
import { ORIGIN_CITIES, TIMINGS_NOTE } from "@/config/trip-request";

/**
 * Where the trip starts, and how each person gets to it.
 *
 * This used to be one grey line saying "starts and ends at X, land before
 * midday" — which is fine if you already live in the right city and useless if
 * you're in Mumbai wondering whether you're expected to sort your own flight.
 * Every city here deep-links into the booking form with the origin already
 * chosen, so picking one is the first answer given rather than a question
 * asked twice.
 */
export function GettingThere({
  tripSlug,
  destinationName,
  startingPoint,
}: {
  tripSlug: string;
  destinationName: string;
  startingPoint: string | null;
}) {
  // "I'm already there" and "Another city" are answers, not routes — they read
  // wrong as chips next to "Delhi NCR → Udaipur".
  const cities = ORIGIN_CITIES.filter(
    (city) => city.value !== "local" && city.value !== "other"
  );

  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="heading-sm text-lg text-ink">Where it starts, and how you get there</h2>

      {startingPoint && (
        <p className="mt-2.5 text-sm leading-relaxed text-ink-700">
          <strong className="font-semibold text-ink">Starts and ends at:</strong> {startingPoint}.
        </p>
      )}

      <p className="mt-2 text-sm leading-relaxed text-ink-500">
        Aim to arrive before midday<Asterisk /> on the first day and to leave after 8pm
        <Asterisk /> on the last. Everything between those two points — stays, transport,
        sightseeing — is ours to arrange.
      </p>

      <div className="mt-5 rounded-xl bg-cream-300 p-4">
        <p className="text-sm font-semibold text-ink">Travelling in from another city?</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-500">
          Pick where you&apos;re starting from. We can book the flight or train with the rest of
          the group and you pay the fare, or you arrange it yourself and we&apos;ll tell you
          exactly when to land and when to leave.
        </p>

        <ul className="mt-3.5 flex flex-wrap gap-2">
          {cities.map((city) => (
            <li key={city.value}>
              <Link
                href={`/booking/${tripSlug}?from=${city.value}`}
                className="flex items-center gap-1.5 rounded-full border border-border-control bg-white px-3.5 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-pine hover:text-pine"
              >
                {city.label} <ArrowRight size={12} aria-hidden="true" /> {destinationName}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={`/booking/${tripSlug}?from=other`}
              className="flex items-center gap-1.5 rounded-full border border-dashed border-border-control bg-white px-3.5 py-1.5 text-xs font-medium text-ink-500 transition-colors hover:border-pine hover:text-pine"
            >
              Somewhere else
            </Link>
          </li>
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-500">
          <span className="flex items-center gap-1.5">
            <PlaneTakeoff size={13} aria-hidden="true" /> We can book your flight
          </span>
          <span className="flex items-center gap-1.5">
            <TrainFront size={13} aria-hidden="true" /> We can book your train
          </span>
          <span>Or travel on your own, entirely up to you</span>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        <Asterisk /> {TIMINGS_NOTE}
      </p>
    </section>
  );
}

/** The mark itself, decorative to a screen reader — the note carries the meaning. */
function Asterisk() {
  return (
    <span aria-hidden="true" className="text-clay">
      *
    </span>
  );
}
