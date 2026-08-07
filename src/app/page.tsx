import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { DestinationCard } from "@/components/destination-card";
import { DestinationExplorer } from "@/components/home/destination-explorer";
import { TripCard } from "@/components/trips/trip-card";
import { Hero } from "@/components/home/hero";
import { WhyUs } from "@/components/home/why-us";
import { Testimonials } from "@/components/home/testimonials";
import { CtaBanner } from "@/components/home/cta-banner";
import {
  getCurrentEscape,
  getDestinationsWithAvailability,
  getFeaturedReviews,
  getRunningTrips,
} from "@/lib/data";
import { formatDateRange, formatINR, seatsLeft } from "@/lib/utils";

export const revalidate = 300;

export default async function HomePage() {
  // The spotlight trip is whichever published escape ranks highest and still
  // has a bookable date. No slug is hardcoded anywhere on this page.
  const trip = await getCurrentEscape();

  const [running, destinations, reviews] = await Promise.all([
    getRunningTrips({ excludeId: trip?.id, limit: 3 }),
    getDestinationsWithAvailability(),
    getFeaturedReviews(3),
  ]);

  const departure = trip?.departures[0] ?? null;
  const remaining = departure ? seatsLeft(departure.total_seats, departure.seats_booked) : null;
  const price = trip ? (trip.discounted_price ?? trip.price_per_person) : null;

  const bookableDestinations = destinations.filter((d) => d.tripCount > 0);
  const explorerDestinations = (bookableDestinations.length > 0 ? bookableDestinations : destinations).slice(0, 6);
  const gridDestinations = destinations.slice(0, 8);

  return (
    <>
      <Hero trip={trip} departure={departure} />

      {!trip && (
        <section className="py-24">
          <Container className="max-w-xl text-center">
            <h2 className="font-display text-3xl font-semibold text-ink">
              Our next escape is being finalised
            </h2>
            <p className="mt-3 text-ink-500">
              Dates, route and pricing go live here shortly. Leave your email and you&apos;ll hear
              before anyone else.
            </p>
            <Link href="/trips#notify" className="btn-accent mt-7 px-7 py-3.5">
              Get notified <ArrowRight size={16} />
            </Link>
          </Container>
        </section>
      )}

      {/* ---- Explore where we go -------------------------------------------- */}
      {explorerDestinations.length > 0 && (
        <section id="explore" className="scroll-mt-20 py-20 sm:py-24">
          <Container>
            <SectionHeading
              eyebrow="Explore"
              title="Outway Club isn't one trip. It's a way of running them."
              description="Small groups, fixed departures, everything booked before it goes on sale, across every part of India we run in. Pick a place to see what that looks like there."
            />
            <div className="mt-12">
              <DestinationExplorer destinations={explorerDestinations} />
            </div>
          </Container>
        </section>
      )}

      {/* ---- Also running ------------------------------------------------- */}
      {running.length > 0 && (
        <section className="py-20 sm:py-24">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow="Also open"
                title="Other escapes taking bookings"
                description="Every one of these has its dates, stays and transfers already locked. Nothing here is a placeholder."
              />
              <Link href="/trips" className="btn-ghost shrink-0">
                See all escapes <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {running.map((item, index) => (
                <Reveal key={item.id} delay={index * 90}>
                  <TripCard trip={item} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ---- Other destinations ---------------------------------------------- */}
      {gridDestinations.length > 0 && (
        <section className="bg-cream-300/50 py-20 sm:py-24">
          <Container>
            <SectionHeading
              eyebrow="Other destinations"
              title="More places, some of them still on the drawing board"
              description="A few of these already have a bookable escape. The rest are being planned end to end before they go on sale, same as every trip here, so we mark them rather than pretend."
            />

            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {gridDestinations.map((destination, index) => (
                <Reveal key={destination.id} delay={index * 60}>
                  <DestinationCard destination={destination} tripCount={destination.tripCount} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      <WhyUs />

      {/* ---- Booking band --------------------------------------------------- */}
      {trip && (
        <section className="py-20 sm:py-24">
          <Container>
            <Reveal>
              <div className="overflow-hidden rounded-3xl bg-pine-700 px-8 py-12 text-cream-100 sm:px-14 sm:py-14">
                <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                      {departure && remaining !== null && remaining > 0
                        ? `${remaining} of ${departure.total_seats} seats left · ${formatDateRange(departure.start_date, departure.end_date)}`
                        : departure
                          ? formatDateRange(departure.start_date, departure.end_date)
                          : "Dates opening soon"}
                    </p>
                    <h2 className="max-w-lg font-display text-3xl font-semibold sm:text-4xl">
                      {trip.group_size_max} seats, and we don&apos;t add more.
                    </h2>
                    <p className="mt-4 max-w-lg leading-relaxed text-cream-100/75">
                      A departure is capped at {trip.group_size_max} because that&apos;s the number
                      the itinerary was built for. We don&apos;t squeeze in extra people once
                      it&apos;s full, we open another date instead.
                    </p>
                  </div>

                  <div className="shrink-0">
                    {price !== null && (
                      <div className="mb-4 flex items-baseline gap-3">
                        <span className="font-display text-4xl font-semibold">
                          {formatINR(price)}
                        </span>
                        {trip.discounted_price && (
                          <span className="text-cream-100/45 line-through">
                            {formatINR(trip.price_per_person)}
                          </span>
                        )}
                      </div>
                    )}
                    <Link
                      href={`/trips/${trip.slug}`}
                      className="btn-accent w-full px-8 py-4 text-base sm:w-auto"
                    >
                      Book your seat <ArrowRight size={18} />
                    </Link>
                    <p className="mt-3 text-xs text-cream-100/55">
                      Secure checkout via Razorpay · UPI, cards, netbanking
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      )}

      <Testimonials reviews={reviews} />

      <CtaBanner />
    </>
  );
}
