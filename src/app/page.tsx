import Link from "next/link";
import { ArrowRight, Check, Compass, Moon, Sunrise } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { SmartImage } from "@/components/ui/smart-image";
import { Hero } from "@/components/home/hero";
import { WhyUs } from "@/components/home/why-us";
import { Testimonials } from "@/components/home/testimonials";
import { CtaBanner } from "@/components/home/cta-banner";
import { getTripBySlug, getFeaturedReviews } from "@/lib/data";
import { LAUNCH_TRIP_SLUG } from "@/config/site";
import { formatINR, seatsLeft } from "@/lib/utils";

export const revalidate = 300;

const DAY_ICONS = [Compass, Moon, Sunrise];

export default async function HomePage() {
  const [trip, reviews] = await Promise.all([
    getTripBySlug(LAUNCH_TRIP_SLUG),
    getFeaturedReviews(3),
  ]);

  const departure = trip?.departures[0] ?? null;
  const remaining = departure ? seatsLeft(departure.total_seats, departure.seats_booked) : null;
  const price = trip ? (trip.discounted_price ?? trip.price_per_person) : null;

  return (
    <>
      <Hero trip={trip} departure={departure} />

      {trip ? (
        <>
          {/* ---- The pitch, in three days ---------------------------------- */}
          <section className="py-20 sm:py-24">
            <Container>
              <SectionHeading
                eyebrow="Escape 001"
                title="Three days, planned to the hour and then left alone"
                description="Every day has a shape, and enough room inside it that you're not being marched between photo stops. Here's the whole thing."
              />

              <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {trip.itinerary_days.map((day, index) => {
                  const Icon = DAY_ICONS[index] ?? Compass;
                  return (
                    <Reveal key={day.id} delay={index * 100}>
                      <article className="flex h-full flex-col rounded-3xl border border-border bg-white p-7 shadow-soft transition-shadow hover:shadow-card">
                        <div className="mb-5 flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine-50 text-pine">
                            <Icon size={19} />
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                            Day {day.day_number}
                          </span>
                        </div>

                        <h3 className="font-display text-xl font-semibold leading-snug text-ink">
                          {day.title}
                        </h3>
                        <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">
                          {day.description}
                        </p>

                        {day.accommodation && (
                          <p className="mt-5 border-t border-border pt-4 text-xs text-ink-400">
                            Night {day.day_number}: {day.accommodation}
                          </p>
                        )}
                      </article>
                    </Reveal>
                  );
                })}
              </div>

              <div className="mt-10 text-center">
                <Link href={`/trips/${trip.slug}`} className="btn-outline px-7 py-3.5">
                  Full day-by-day itinerary <ArrowRight size={16} />
                </Link>
              </div>
            </Container>
          </section>

          {/* ---- Highlights over the hero image ---------------------------- */}
          <section className="bg-cream-300/50 py-20 sm:py-24">
            <Container>
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
                <Reveal>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lifted">
                    <SmartImage
                      src={trip.gallery[0] ?? trip.hero_image}
                      alt={trip.title}
                      fill
                      sizes="(min-width: 1024px) 45vw, 100vw"
                      className="object-cover"
                      fallbackLabel="Udaipur"
                    />
                  </div>
                </Reveal>

                <Reveal delay={120}>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
                    What you&apos;ll remember
                  </p>
                  <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
                    Six things worth the weekend
                  </h2>

                  <ul className="mt-8 space-y-4">
                    {trip.highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-3.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine text-cream-100">
                          <Check size={12} strokeWidth={3} />
                        </span>
                        <span className="text-[15px] leading-relaxed text-ink-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            </Container>
          </section>

          <WhyUs />

          {/* ---- Booking band ---------------------------------------------- */}
          <section className="py-20 sm:py-24">
            <Container>
              <Reveal>
                <div className="overflow-hidden rounded-3xl bg-pine-700 px-8 py-12 text-cream-100 sm:px-14 sm:py-14">
                  <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                        {remaining !== null && remaining > 0
                          ? `${remaining} of ${departure!.total_seats} seats left · 15–17 August`
                          : "15 – 17 August"}
                      </p>
                      <h2 className="max-w-lg font-display text-3xl font-semibold sm:text-4xl">
                        One departure. Eighteen seats. No second batch.
                      </h2>
                      <p className="mt-4 max-w-lg leading-relaxed text-cream-100/75">
                        We aren&apos;t running this again in August, and we don&apos;t add seats to
                        a full departure. When it&apos;s gone, the next thing on this site is
                        Escape 002.
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
                      <Link href={`/trips/${trip.slug}`} className="btn-accent w-full px-8 py-4 text-base sm:w-auto">
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
        </>
      ) : (
        <section className="py-24">
          <Container className="max-w-xl text-center">
            <h2 className="font-display text-3xl font-semibold text-ink">
              Our next escape is being finalised
            </h2>
            <p className="mt-3 text-ink-500">
              Dates, route and pricing go live here shortly. Leave your email and you&apos;ll hear
              before anyone else.
            </p>
            <Link href="/upcoming" className="btn-accent mt-7 px-7 py-3.5">
              Get notified <ArrowRight size={16} />
            </Link>
          </Container>
        </section>
      )}

      <Testimonials reviews={reviews} />

      <CtaBanner />
    </>
  );
}
