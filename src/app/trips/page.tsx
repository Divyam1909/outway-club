import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CalendarDays, Compass, Mountain, Sailboat, Tent } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { NewsletterForm } from "@/components/newsletter-form";
import { TripCard } from "@/components/trips/trip-card";
import { ComingSoonEscapeCard } from "@/components/coming-soon-card";
import { CatalogueFilters } from "@/components/trips/catalogue-filters";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getCatalogueTrips, getCatalogueFacets } from "@/lib/data";
import { PIPELINE, type PipelineEntry } from "@/config/pipeline";
import { fillWithUpcoming } from "@/config/upcoming-destinations";
import type { Category, Difficulty, DurationBucket, TripSort } from "@/lib/types";

export const metadata: Metadata = {
  title: "Escapes",
  description:
    "Every Outway Club escape: small-group departures across India, each one planned end to end and capped tight. Filter by month, region, theme or budget.",
  alternates: { canonical: "/trips" },
};

const PIPELINE_ICONS = {
  mountain: Mountain,
  sailboat: Sailboat,
  tent: Tent,
  compass: Compass,
} satisfies Record<PipelineEntry["icon"], typeof Compass>;

export const revalidate = 300;

const DURATION_VALUES: DurationBucket[] = ["short", "medium", "long"];
const SORT_VALUES: TripSort[] = ["soonest", "popular", "price_low", "price_high", "duration"];

/** Query strings are user input — anything unrecognised is dropped, not trusted. */
function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const duration = one(params.duration);
  const sort = one(params.sort);
  const maxPrice = Number(one(params.maxPrice));

  const filters = {
    month: one(params.month),
    region: one(params.region),
    category: one(params.category) as Category | undefined,
    difficulty: one(params.difficulty) as Difficulty | undefined,
    duration: DURATION_VALUES.includes(duration as DurationBucket)
      ? (duration as DurationBucket)
      : undefined,
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : undefined,
    sort: SORT_VALUES.includes(sort as TripSort) ? (sort as TripSort) : undefined,
  };

  const [trips, facets] = await Promise.all([
    getCatalogueTrips(filters),
    getCatalogueFacets(),
  ]);

  const bookable = trips.filter((trip) => trip.departures.length > 0);
  const waitlist = trips.filter((trip) => trip.departures.length === 0);

  // While the catalogue is small, top the first row up with places we're
  // planning rather than leaving a half-empty grid. Suppressed the moment
  // someone filters: a "coming soon" card can't honestly claim to match a
  // month, a budget or a region the filters just asked for.
  // `sort` reorders the same result set, so it doesn't count as narrowing.
  const isUnfiltered = !(
    filters.month ||
    filters.region ||
    filters.category ||
    filters.difficulty ||
    filters.duration ||
    filters.maxPrice
  );
  const catalogueUpcoming = isUnfiltered
    ? fillWithUpcoming(bookable.length + waitlist.length, 3)
    : [];

  return (
    <div className="section-sm">
      <Container>
        <div className="mb-8 max-w-2xl">
          <Eyebrow className="mb-2">
            Small groups, fixed departures
          </Eyebrow>
          <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">Escapes</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-500">
            Each of these was planned end to end before it went on sale: every night, every
            transfer, every meal already booked. Nothing on this page is a placeholder waiting for
            someone to fill in the details.
          </p>
        </div>

        {/* useSearchParams needs a Suspense boundary to keep the route static. */}
        <Suspense fallback={<div className="h-40 rounded-2xl bg-cream-300" />}>
          <CatalogueFilters facets={facets} resultCount={trips.length} />
        </Suspense>

        {trips.length === 0 && !isUnfiltered ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-white/60 p-14 text-center">
            <p className="font-display text-2xl font-semibold text-ink">
              Nothing matches that combination
            </p>
            <p className="mx-auto mt-3 max-w-md text-ink-500">
              Clear a filter or two, or tell us where you&apos;d like to go, we plan the calendar
              around what people actually ask for.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/trips" className="btn-outline px-6 py-3">
                Clear filters
              </Link>
              <Link href="#notify" className="btn-primary px-6 py-3">
                Get notified <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bookable.map((trip, index) => (
                <Reveal key={trip.id} delay={Math.min(index, 5) * 70}>
                  <TripCard trip={trip} />
                </Reveal>
              ))}
              {catalogueUpcoming.map((place, index) => (
                <Reveal key={place.name} delay={Math.min(bookable.length + index, 5) * 70}>
                  <ComingSoonEscapeCard place={place} />
                </Reveal>
              ))}
            </div>

            {catalogueUpcoming.length > 0 && (
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-500">
                The dashed cards aren&apos;t on sale. They&apos;re the places we&apos;re planning
                next, and they&apos;ll get a price and a date here only once every night and
                transfer on them is actually booked.
              </p>
            )}

            {waitlist.length > 0 && (
              <div className="mt-14">
                <div className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-ink-500">
                  <CalendarDays size={15} />
                  Between dates
                </div>
                <p className="mb-6 max-w-xl text-ink-500">
                  These have run before and will run again, we just haven&apos;t published the
                  next date yet. Open one to join its waitlist.
                </p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {waitlist.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* --- Notify me -------------------------------------------------------- */}
        <section id="notify" className="mt-16 scroll-mt-24">
          <Reveal>
            <div className="overflow-hidden rounded-3xl bg-pine-700 px-8 py-12 text-cream-100 sm:px-12 sm:py-14">
              <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                <div className="max-w-lg">
                  <Eyebrow tone="dark">
                    What&apos;s next
                  </Eyebrow>
                  <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                    Be told before anyone else.
                  </h2>
                  <p className="mt-3 leading-relaxed text-cream-100/75">
                    A new escape goes on sale only once every night, transfer and meal is actually
                    booked. Put your email down and you&apos;ll hear before it&apos;s announced
                    anywhere else.
                  </p>
                </div>
                <div className="w-full shrink-0 sm:max-w-sm">
                  <NewsletterForm source="trips" buttonLabel="Notify me" />
                  <p className="mt-3 text-xs leading-relaxed text-cream-100/50">
                    One email per escape. No newsletter, no drip sequence, unsubscribe in one
                    click.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* --- What's in the works ----------------------------------------------- */}
        {PIPELINE.length > 0 && (
          <section className="mt-16">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                What&apos;s in the works
              </h2>
              <p className="mt-3 leading-relaxed text-ink-500">
                Not bookable, not dated, and deliberately vague about where. We won&apos;t name a
                destination until it&apos;s confirmed, because half of these will change.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {PIPELINE.map((entry, index) => {
                const Icon = PIPELINE_ICONS[entry.icon];
                return (
                  <Reveal key={entry.theme} delay={index * 90}>
                    <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-7">
                      <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-pine-50 text-pine">
                        <Icon size={21} />
                      </span>
                      <h3 className="heading-sm text-xl text-ink">
                        {entry.theme}
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">
                        {entry.body}
                      </p>
                      <p className="mt-6 border-t border-border pt-4 text-xs font-medium uppercase tracking-[0.18em] text-ink-500">
                        {entry.status}
                      </p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </section>
        )}
      </Container>
    </div>
  );
}
