import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SmartImage } from "@/components/ui/smart-image";
import { MapPin, CalendarDays } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { TripCard } from "@/components/trips/trip-card";
import { getDestinationBySlug, getTripsByDestination } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  if (!isSupabaseConfigured()) return {};
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) return {};
  return {
    title: destination.name,
    description: destination.tagline ?? destination.description ?? undefined,
  };
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) notFound();

  const trips = await getTripsByDestination(destination.id);

  return (
    <div>
      <section className="relative flex h-[26rem] items-end">
        <SmartImage
          src={destination.hero_image}
          alt={destination.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          fallbackLabel={destination.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
        <Container className="relative pb-10 text-cream-100">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-cream-100/80">
            <MapPin size={14} /> {destination.region}, {destination.country}
          </p>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">{destination.name}</h1>
          {destination.tagline && (
            <p className="mt-2 max-w-xl text-cream-100/85">{destination.tagline}</p>
          )}
        </Container>
      </section>

      <Container className="py-14">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr]">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold text-ink">About {destination.name}</h2>
            <p className="mt-3 leading-relaxed text-ink-500">{destination.description}</p>

            {destination.gallery.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {destination.gallery.map((src, i) => (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-xl">
                    <SmartImage
                      src={src}
                      alt={`${destination.name} ${i + 1}`}
                      fill
                      sizes="25vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </Reveal>

          <Reveal delay={100}>
            <div className="h-fit rounded-2xl border border-border bg-white p-6 shadow-soft">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink-400">
                Good to know
              </p>
              <div className="flex items-start gap-3">
                <CalendarDays size={18} className="mt-0.5 shrink-0 text-pine" />
                <div>
                  <p className="text-sm font-semibold text-ink">Best time to visit</p>
                  <p className="text-sm text-ink-500">{destination.best_time ?? "Year-round"}</p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-pine" />
                <div>
                  <p className="text-sm font-semibold text-ink">Trips here</p>
                  <p className="text-sm text-ink-500">
                    {trips.length} trip{trips.length !== 1 ? "s" : ""} currently running
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold text-ink">
            Trips in {destination.name}
          </h2>
          {trips.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip, index) => (
                <Reveal key={trip.id} delay={Math.min(index, 5) * 70}>
                  <TripCard trip={trip} />
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-ink-500">
              No published trips here yet. Check back soon, or get in touch to build one.
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}
