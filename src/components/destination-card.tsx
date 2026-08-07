import Link from "next/link";
import { Clock3 } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import type { Destination } from "@/lib/types";

/**
 * `tripCount` is optional so this still works anywhere a plain Destination is
 * all that's available. When it's supplied and zero, the card advertises
 * "Coming soon" and routes to the notify-me page instead of a destination
 * page that would otherwise say "no trips here yet".
 */
export function DestinationCard({
  destination,
  tripCount,
}: {
  destination: Destination;
  tripCount?: number;
}) {
  const comingSoon = tripCount === 0;
  const href = comingSoon
    ? `/coming-soon?place=${encodeURIComponent(destination.name)}`
    : `/destinations/${destination.slug}`;

  return (
    <Link
      href={href}
      className="group relative flex aspect-[3/4] w-full shrink-0 snap-start overflow-hidden rounded-2xl"
    >
      <SmartImage
        src={destination.hero_image}
        alt={destination.name}
        fill
        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 70vw"
        className={clsxComingSoon(comingSoon)}
        fallbackLabel={destination.name}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />

      {comingSoon && (
        <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-cream-100/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-clay shadow-soft">
          <Clock3 size={12} /> Coming soon
        </span>
      )}

      <div className="relative mt-auto flex flex-col gap-1 p-5 text-cream-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-cream-100/70">
          {destination.region}
        </p>
        <h3 className="font-display text-2xl font-semibold">{destination.name}</h3>
        <p className="line-clamp-1 text-sm text-cream-100/80">{destination.tagline}</p>
      </div>
    </Link>
  );
}

function clsxComingSoon(comingSoon: boolean): string {
  const base = "object-cover transition-transform duration-500 group-hover:scale-110 motion-reduce:group-hover:scale-100";
  return comingSoon ? `${base} grayscale-[35%]` : base;
}
