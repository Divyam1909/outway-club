import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Mountain, Sailboat, Tent } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { NewsletterForm } from "@/components/newsletter-form";
import { getTripBySlug } from "@/lib/data";
import { LAUNCH_TRIP_SLUG, site } from "@/config/site";

export const metadata: Metadata = {
  title: "Upcoming escapes",
  description:
    "Escape 002 and beyond. We run one trip at a time and open the next only when it's fully planned — join the list to hear first.",
  alternates: { canonical: "/upcoming" },
};

export const revalidate = 600;

/**
 * Deliberately vague about *where* Escape 002 goes, because we don't know yet
 * and inventing a destination would be exactly the kind of thing this page
 * exists to avoid. What it does commit to is the shape of the trips.
 */
const IN_THE_WORKS = [
  {
    number: "002",
    icon: Mountain,
    theme: "A proper Himalayan week",
    body: "Longer, higher, slower. Enough days that acclimatising isn't something we rush, and a route that doesn't turn into eight hours a day in a vehicle.",
    season: "Being scouted for late 2026",
  },
  {
    number: "003",
    icon: Sailboat,
    theme: "Coast and backwater",
    body: "The version of a beach trip that isn't just a beach — water you can actually swim in, food worth planning a day around, and no resort buffet anywhere in the itinerary.",
    season: "Winter 2026–27",
  },
  {
    number: "004",
    icon: Tent,
    theme: "Something without a road",
    body: "A trek or an overland stretch where the point is that it's hard to reach. Smaller group, more kit, a lot more preparation from us before it goes on sale.",
    season: "Under discussion",
  },
];

export default async function UpcomingPage() {
  const current = await getTripBySlug(LAUNCH_TRIP_SLUG);

  return (
    <div className="pb-20 sm:pb-24">
      {/* --- Header ---------------------------------------------------------- */}
      <section className="border-b border-border bg-cream-300/40 py-16 sm:py-20">
        <Container className="max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
            Escape 002 and beyond
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            We&apos;re building more meaningful journeys for you.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
            Outway runs one escape at a time. While Escape 001 is live, the next one is being
            walked, driven, eaten and argued about — and it goes on sale only when every night,
            every transfer and every meal is actually booked.
          </p>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink-500">
            That&apos;s slower than putting up a page with a photo and a &ldquo;coming soon&rdquo;
            badge. It&apos;s also the reason the first one is worth booking.
          </p>
        </Container>
      </section>

      {/* --- Notify me ------------------------------------------------------- */}
      <section className="py-14 sm:py-16">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-white p-8 text-center shadow-card sm:p-10">
              <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-clay-50 text-clay">
                <Compass size={22} />
              </span>
              <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                Be told before anyone else
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
                When a new escape opens, this list gets the dates, the route and a booking link
                first. Departures are capped at eighteen, so a few days&apos; head start genuinely
                matters.
              </p>

              <div className="mx-auto mt-7 max-w-md">
                <NewsletterForm
                  source="upcoming"
                  variant="light"
                  buttonLabel="Notify me"
                />
              </div>

              <p className="mt-4 text-xs leading-relaxed text-ink-400">
                One email per escape. No newsletter, no drip sequence, unsubscribe in one click.
                See our{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-pine">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* --- What's in the works --------------------------------------------- */}
      <section className="py-6">
        <Container>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold text-ink">What&apos;s in the works</h2>
            <p className="mt-3 leading-relaxed text-ink-500">
              We won&apos;t name a destination until it&apos;s confirmed, because half of these will
              change. Here&apos;s the honest state of each one.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {IN_THE_WORKS.map((escape, index) => (
              <Reveal key={escape.number} delay={index * 90}>
                <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white p-7">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-5 top-4 font-display text-[4.5rem] font-semibold leading-none text-cream-300"
                  >
                    {escape.number}
                  </span>

                  <span className="relative mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-pine-50 text-pine">
                    <escape.icon size={21} />
                  </span>

                  <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                    Escape {escape.number}
                  </p>
                  <h3 className="relative mt-1.5 font-display text-xl font-semibold text-ink">
                    {escape.theme}
                  </h3>
                  <p className="relative mt-3 flex-1 text-sm leading-relaxed text-ink-500">
                    {escape.body}
                  </p>
                  <p className="relative mt-6 border-t border-border pt-4 text-xs font-medium uppercase tracking-wider text-ink-400">
                    {escape.season}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* --- Back to what's live --------------------------------------------- */}
      {current && (
        <section className="pt-16 sm:pt-20">
          <Container>
            <Reveal>
              <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-pine-700 px-8 py-10 text-cream-100 sm:px-12 lg:flex-row lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                    Live right now
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                    {current.title}
                  </h2>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-cream-100/75">
                    15–17 August · {current.duration_days} days · capped at{" "}
                    {current.group_size_max} travellers.
                  </p>
                </div>
                <Link href={`/trips/${current.slug}`} className="btn-accent shrink-0 px-7 py-3.5">
                  See the itinerary <ArrowRight size={17} />
                </Link>
              </div>
            </Reveal>
          </Container>
        </section>
      )}

      <Container className="mt-14 text-center">
        <p className="text-sm text-ink-500">
          Somewhere specific you want us to run?{" "}
          <a
            href={`mailto:${site.email}?subject=${encodeURIComponent("Escape idea")}`}
            className="font-medium text-pine underline underline-offset-2"
          >
            Tell us
          </a>{" "}
          — we read every suggestion, and the list above isn&apos;t fixed.
        </p>
      </Container>
    </div>
  );
}
