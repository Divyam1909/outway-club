"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { clsx } from "clsx";
import { SmartImage } from "@/components/ui/smart-image";
import type { Destination } from "@/lib/types";

/**
 * A pin-picker, not a literal map. Real map coordinates only make sense
 * pinned to an actual map image, which we don't have real geodata for yet;
 * a wrapping row of tappable "pins" gets the same browse-by-place feel
 * without depending on percentage-based positioning that breaks the moment
 * a screen is narrower than the map was drawn for.
 */
export function DestinationExplorer({ destinations }: { destinations: Destination[] }) {
  const [activeId, setActiveId] = useState(destinations[0]?.id);
  const active = destinations.find((destination) => destination.id === activeId) ?? destinations[0];

  if (!active) return null;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-10">
      <div className="flex flex-wrap gap-2.5">
        {destinations.map((destination) => {
          const isActive = destination.id === active.id;
          return (
            <button
              key={destination.id}
              type="button"
              onMouseEnter={() => setActiveId(destination.id)}
              onFocus={() => setActiveId(destination.id)}
              onClick={() => setActiveId(destination.id)}
              aria-pressed={isActive}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "border-pine bg-pine text-cream-100 shadow-card"
                  : "border-border bg-white text-ink-700 hover:border-pine/40 hover:bg-pine-50/60"
              )}
            >
              <MapPin size={14} className={isActive ? "text-gold" : "text-clay"} />
              {destination.name}
            </button>
          );
        })}
      </div>

      <Link
        href={`/destinations/${active.slug}`}
        className="group relative block aspect-[16/11] w-full overflow-hidden rounded-3xl shadow-lifted sm:aspect-[16/9]"
      >
        <SmartImage
          key={active.id}
          src={active.hero_image}
          alt={active.name}
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="animate-fade-in object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
          fallbackLabel={active.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-6 text-cream-100 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-cream-100/70">
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
    </div>
  );
}
