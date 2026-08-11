"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, MapPin } from "lucide-react";
import { clsx } from "clsx";
import { SmartImage } from "@/components/ui/smart-image";
import type { UpcomingDestination } from "@/config/upcoming-destinations";
import type { Destination } from "@/lib/types";

/**
 * A pin-picker, not a literal map. Real map coordinates only make sense
 * pinned to an actual map image, which we don't have real geodata for yet;
 * a wrapping row of tappable "pins" gets the same browse-by-place feel
 * without depending on percentage-based positioning that breaks the moment
 * a screen is narrower than the map was drawn for.
 *
 * Places we're still planning get pins too, marked and visually quieter, so
 * the picker reads as a map of where the club goes rather than a lonely single
 * button. Selecting one shows what we can honestly show — no photo, no dates,
 * and a notify-me link instead of a destination page.
 */

type Spot =
  | { kind: "live"; key: string; name: string; region: string; tagline: string | null; slug: string; image: string | null }
  | { kind: "soon"; key: string; name: string; region: string; tagline: string; status: string; tone: string };

export function DestinationExplorer({
  destinations,
  upcoming = [],
}: {
  destinations: Destination[];
  upcoming?: UpcomingDestination[];
}) {
  const spots: Spot[] = [
    ...destinations.map(
      (destination): Spot => ({
        kind: "live",
        key: `live-${destination.id}`,
        name: destination.name,
        region: destination.region,
        tagline: destination.tagline,
        slug: destination.slug,
        image: destination.hero_image,
      })
    ),
    ...upcoming.map(
      (place): Spot => ({
        kind: "soon",
        key: `soon-${place.name}`,
        name: place.name,
        region: place.region,
        tagline: place.tagline,
        status: place.status,
        tone: place.tone,
      })
    ),
  ];

  const [activeKey, setActiveKey] = useState(spots[0]?.key);
  const active = spots.find((spot) => spot.key === activeKey) ?? spots[0];

  if (!active) return null;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-10">
      <div>
        <div className="flex flex-wrap gap-2.5">
          {spots.map((spot) => {
            const isActive = spot.key === active.key;
            const isSoon = spot.kind === "soon";
            return (
              <button
                key={spot.key}
                type="button"
                onMouseEnter={() => setActiveKey(spot.key)}
                onFocus={() => setActiveKey(spot.key)}
                onClick={() => setActiveKey(spot.key)}
                aria-pressed={isActive}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "border-pine bg-pine text-cream-100 shadow-card"
                    : isSoon
                      ? "border-dashed border-ink/15 bg-transparent text-ink-500 hover:border-clay/50 hover:bg-clay-50/50 hover:text-ink"
                      : "border-border bg-white text-ink-700 hover:border-pine/40 hover:bg-pine-50/60"
                )}
              >
                {isSoon ? (
                  <Clock3 size={14} className={isActive ? "text-gold" : "text-ink-500"} />
                ) : (
                  <MapPin size={14} className={isActive ? "text-gold" : "text-clay"} />
                )}
                {spot.name}
              </button>
            );
          })}
        </div>

        {upcoming.length > 0 && (
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-500">
            <span className="inline-flex items-center gap-1.5 font-medium text-ink-500">
              <Clock3 size={13} /> Dashed pins
            </span>{" "}
            are places we&apos;re planning, not selling. They go on sale only once every night and
            transfer on them is booked.
          </p>
        )}
      </div>

      {active.kind === "live" ? (
        <Link
          href={`/destinations/${active.slug}`}
          className="group relative block aspect-[16/11] w-full overflow-hidden rounded-3xl shadow-lifted sm:aspect-[16/9]"
        >
          <SmartImage
            key={active.key}
            src={active.image}
            alt={active.name}
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="animate-fade-in object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
            fallbackLabel={active.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-6 text-cream-100 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream-100/70">
              {active.region}
            </p>
            <h3 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{active.name}</h3>
            {active.tagline && (
              <p className="mt-2 max-w-md text-sm leading-relaxed text-cream-100/85">
                {active.tagline}
              </p>
            )}
            <span className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-gold">
              Explore {active.name} <ArrowRight size={15} />
            </span>
          </div>
        </Link>
      ) : (
        <Link
          key={active.key}
          href={`/coming-soon?place=${encodeURIComponent(active.name)}`}
          className={clsx(
            "group relative block aspect-[16/11] w-full animate-fade-in overflow-hidden rounded-3xl bg-gradient-to-br shadow-lifted sm:aspect-[16/9]",
            active.tone
          )}
        >
          <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.14]">
            <svg viewBox="0 0 320 180" className="h-full w-full" fill="none" stroke="currentColor">
              <g className="text-cream-100" strokeWidth="1.2">
                <path d="M-20 150 C 60 116, 120 176, 200 132 S 300 96, 340 124" />
                <path d="M-20 172 C 60 138, 120 198, 200 154 S 300 118, 340 146" />
                <path d="M-20 128 C 60 94, 120 154, 200 110 S 300 74, 340 102" />
                <path d="M-20 106 C 60 72, 120 132, 200 88 S 300 52, 340 80" />
              </g>
            </svg>
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />

          <span className="absolute right-5 top-5 flex items-center gap-1.5 rounded-full bg-cream-100/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-clay shadow-soft">
            <Clock3 size={12} /> Coming soon
          </span>

          <div className="relative flex h-full flex-col justify-end p-6 text-cream-100 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream-100/70">
              {active.region}
            </p>
            <h3 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{active.name}</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-cream-100/85">
              {active.tagline}
            </p>
            <span className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-gold">
              {active.status} · Get notified <ArrowRight size={15} />
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
