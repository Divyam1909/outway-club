import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { TripCard } from "@/components/trips/trip-card";
import { DestinationCard } from "@/components/destination-card";
import { Hero } from "@/components/home/hero";
import { WhyUs } from "@/components/home/why-us";
import { Testimonials } from "@/components/home/testimonials";
import { CtaBanner } from "@/components/home/cta-banner";
import { getFeaturedTrips, getFeaturedDestinations, getFeaturedReviews } from "@/lib/data";

export default async function HomePage() {
  const [featuredTrips, destinations, reviews] = await Promise.all([
    getFeaturedTrips(6),
    getFeaturedDestinations(),
    getFeaturedReviews(6),
  ]);

  return (
    <>
      <Hero />

      <section className="py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Handpicked"
              title="Featured trips this season"
              description="A mix of our best-rated group departures and private escapes, updated as the seasons change."
            />
            <Link href="/trips" className="btn-outline shrink-0">
              View all trips <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-cream-300/60 py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Where to next"
              title="Browse by destination"
              description="Every region we run trips in, from the high Himalayas to island coastlines."
            />
            <Link href="/destinations" className="btn-outline shrink-0">
              All destinations <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-10 flex snap-x gap-5 overflow-x-auto pb-4">
            {destinations.map((destination) => (
              <div key={destination.id} className="w-[75%] shrink-0 sm:w-[40%] lg:w-[22%]">
                <DestinationCard destination={destination} />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <WhyUs />

      <section className="py-20">
        <Container>
          <div className="overflow-hidden rounded-3xl bg-clay-50 px-8 py-12 sm:px-14">
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-clay-600">
                  Travelling with friends?
                </p>
                <h2 className="max-w-lg font-display text-3xl font-semibold text-ink sm:text-4xl">
                  Fixed-date group departures, with real seats left to fill.
                </h2>
                <p className="mt-3 max-w-lg text-ink-500">
                  See live seat availability, exact departure dates, and travel with a small
                  group of like-minded people — no waiting around for a batch to be confirmed.
                </p>
              </div>
              <Link href="/group-trips" className="btn-accent shrink-0 px-7 py-3.5">
                See group departures <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Testimonials reviews={reviews} />

      <CtaBanner />
    </>
  );
}
