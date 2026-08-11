import Link from "next/link";
import { ArrowRight, Clock3, Compass } from "lucide-react";
import { clsx } from "clsx";
import type { UpcomingDestination } from "@/config/upcoming-destinations";

/**
 * Cards for places in `src/config/upcoming-destinations.ts`.
 *
 * They deliberately don't look like a real listing: no price, no dates, no
 * photograph, and a "Coming soon" mark on every one. Clicking goes to
 * /coming-soon, which is a notify-me page — so an unfinished-looking gap
 * becomes an email capture instead of a dead end.
 *
 * Two shapes, matching the two grids they fill: the 3:4 portrait tile used by
 * DestinationCard, and the 4:3 catalogue tile used by TripCard.
 */

function href(place: UpcomingDestination): string {
  return `/coming-soon?place=${encodeURIComponent(place.name)}`;
}

/** Portrait tile, sits alongside <DestinationCard />. */
export function ComingSoonDestinationCard({ place }: { place: UpcomingDestination }) {
  return (
    <Link
      href={href(place)}
      aria-label={`${place.name} — coming soon, get notified`}
      className={clsx(
        "group relative flex aspect-[3/4] w-full shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-gradient-to-br",
        place.tone
      )}
    >
      {/* A faint topographic wash, so the panel reads as designed rather than
          as an image that failed to load. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]">
        <svg viewBox="0 0 160 220" className="h-full w-full" fill="none" stroke="currentColor">
          <g className="text-cream-100" strokeWidth="1.1">
            <path d="M-20 168 C 30 140, 60 190, 110 156 S 170 128, 200 150" />
            <path d="M-20 190 C 30 162, 60 212, 110 178 S 170 150, 200 172" />
            <path d="M-20 146 C 30 118, 60 168, 110 134 S 170 106, 200 128" />
            <path d="M-20 124 C 30 96, 60 146, 110 112 S 170 84, 200 106" />
          </g>
        </svg>
      </span>

      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

      <span className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-cream-100/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-clay shadow-soft">
        <Clock3 size={12} /> Coming soon
      </span>

      <span className="relative mt-auto flex flex-col gap-1 p-5 text-cream-100">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cream-100/70">
          {place.region}
        </span>
        <span className="font-display text-2xl font-semibold">{place.name}</span>
        <span className="line-clamp-2 text-sm text-cream-100/80">{place.tagline}</span>
        <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-gold">
          {place.status}
          <ArrowRight
            size={13}
            className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
          />
        </span>
      </span>
    </Link>
  );
}

/** Landscape catalogue tile, sits alongside <TripCard /> on /trips. */
export function ComingSoonEscapeCard({ place }: { place: UpcomingDestination }) {
  return (
    <Link
      href={href(place)}
      aria-label={`${place.name} — being planned, get notified`}
      className="card-lift group flex h-full flex-col overflow-hidden rounded-2xl border border-dashed border-border bg-white/70 shadow-soft"
    >
      <div
        className={clsx(
          "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-gradient-to-br",
          place.tone
        )}
      >
        <Compass
          size={34}
          className="text-cream-100/45 transition-transform duration-500 group-hover:rotate-45 motion-reduce:group-hover:rotate-0"
        />
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-cream-100/95 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-clay shadow-soft">
          <Clock3 size={12} /> Coming soon
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{place.region}</p>
        <h3 className="heading-sm text-lg leading-snug text-ink group-hover:text-pine">
          {place.name}
        </h3>
        <p className="text-sm leading-relaxed text-ink-500">{place.tagline}</p>

        <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
          <div>
            <p className="text-xs text-ink-500">Status</p>
            <p className="text-sm font-medium text-ink-700">{place.status}</p>
          </div>
          <span className="btn-ghost btn-sm text-clay">Notify me</span>
        </div>
      </div>
    </Link>
  );
}
