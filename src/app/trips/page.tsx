import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock, MapPin, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";
import { Reveal } from "@/components/ui/reveal";
import { TripCard } from "@/components/trips/trip-card";
import { getAllTrips, getTripBySlug } from "@/lib/data";
import { LAUNCH_TRIP_SLUG } from "@/config/site";
import { formatDateRange, formatINR, seatsLeft } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Escapes",
  description:
    "Every Outway Club escape. Right now that's one: Escape 001 — Udaipur × Mount Abu, 15–17 August, capped at 18 travellers.",
  alternates: { canonical: "/trips" },
};

export const revalidate = 300;

export default async function TripsPage() {
  const [trips, featured] = await Promise.all([
    getAllTrips(),
    getTripBySlug(LAUNCH_TRIP_SLUG),
  ]);

  const others = trips.filter((trip) => trip.slug !== LAUNCH_TRIP_SLUG);
  const departure = featured?.departures[0] ?? null;
  const remaining = departure ? seatsLeft(departure.total_seats, departure.seats_booked) : null;
  const price = featured ? (featured.discounted_price ?? featured.price_per_person) : null;

  return (
    <div className="py-14 sm:py-16">
      <Container>
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
            {trips.length === 1 ? "One escape, running now" : `${trips.length} escapes`}
          </p>
          <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">Escapes</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-500">
            We run one at a time. It keeps the planning obsessive and the group small, and it means
            nothing on this page is a placeholder waiting for someone to fill in the details.
          </p>
        </div>

        {featured ? (
          <Reveal>
            <article className="overflow-hidden rounded-3xl border border-border bg-white shadow-card">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <Link
                  href={`/trips/${featured.slug}`}
                  className="group relative aspect-[16/11] overflow-hidden lg:aspect-auto lg:min-h-[26rem]"
                >
                  <SmartImage
                    src={featured.hero_image}
                    alt={featured.title}
                    fill
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                    fallbackLabel="Escape 001"
                  />
                  <span className="absolute left-4 top-4 flex gap-2">
                    <Badge tone="gold" className="bg-gold text-pine-700 shadow-soft">
                      Escape 001
                    </Badge>
                    {remaining !== null && remaining > 0 && remaining <= 6 && (
                      <Badge tone="clay" className="bg-clay text-cream-100 shadow-soft">
                        {remaining} seats left
                      </Badge>
                    )}
                  </span>
                </Link>

                <div className="flex flex-col justify-center p-7 sm:p-10">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-500">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} /> {featured.destination.name}, {featured.destination.region}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} /> {featured.duration_days}D / {featured.duration_nights}N
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={14} /> Max {featured.group_size_max}
                    </span>
                  </div>

                  <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink">
                    {featured.title}
                  </h2>

                  {departure && (
                    <p className="mt-2 text-sm font-semibold text-clay">
                      {formatDateRange(departure.start_date, departure.end_date)}
                      {remaining !== null && ` · ${remaining} of ${departure.total_seats} seats left`}
                    </p>
                  )}

                  <p className="mt-4 leading-relaxed text-ink-500">{featured.short_description}</p>

                  <ul className="mt-6 space-y-2.5">
                    {featured.highlights.slice(0, 3).map((highlight) => (
                      <li key={highlight} className="flex gap-2.5 text-sm text-ink-700">
                        <Check size={15} className="mt-0.5 shrink-0 text-pine" strokeWidth={3} />
                        {highlight}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-border pt-6">
                    {price !== null && (
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-3xl font-semibold text-ink">
                            {formatINR(price)}
                          </span>
                          {featured.discounted_price && (
                            <span className="text-ink-300 line-through">
                              {formatINR(featured.price_per_person)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-400">per person · taxes included</p>
                      </div>
                    )}
                    <Link href={`/trips/${featured.slug}`} className="btn-accent ml-auto px-7 py-3.5">
                      See the itinerary <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </Reveal>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-white/60 p-14 text-center">
            <p className="font-display text-2xl font-semibold text-ink">
              Between escapes right now
            </p>
            <p className="mx-auto mt-3 max-w-md text-ink-500">
              The next one is being finalised. Join the list and you&apos;ll get the dates before
              they go public.
            </p>
            <Link href="/upcoming" className="btn-accent mt-7">
              Get notified <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {others.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 font-display text-2xl font-semibold text-ink">Also running</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </div>
        )}

        {/* Coming soon rail */}
        <Reveal>
          <section className="mt-16 overflow-hidden rounded-3xl bg-cream-300/60 px-8 py-12 sm:px-12">
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
                  Escape 002 · Coming soon
                </p>
                <h2 className="mt-2 max-w-lg font-display text-2xl font-semibold text-ink sm:text-3xl">
                  We&apos;re building more meaningful journeys for you.
                </h2>
                <p className="mt-3 max-w-lg leading-relaxed text-ink-500">
                  The next escape goes on sale only once every night, transfer and meal is actually
                  booked. Put your email down and you&apos;ll hear before anyone else.
                </p>
              </div>
              <Link href="/upcoming" className="btn-outline shrink-0 px-7 py-3.5">
                See what&apos;s in the works <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </Reveal>
      </Container>
    </div>
  );
}
