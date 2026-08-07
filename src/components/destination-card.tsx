import Link from "next/link";
import { SmartImage } from "@/components/ui/smart-image";
import type { Destination } from "@/lib/types";

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className="group relative flex aspect-[3/4] w-full shrink-0 snap-start overflow-hidden rounded-2xl"
    >
      <SmartImage
        src={destination.hero_image}
        alt={destination.name}
        fill
        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 70vw"
        className="object-cover transition-transform duration-500 group-hover:scale-110 motion-reduce:group-hover:scale-100"
        fallbackLabel={destination.name}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
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
