import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Eyebrow } from "@/components/ui/eyebrow";
import { DestinationCard } from "@/components/destination-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getDestinationsWithAvailability } from "@/lib/data";

export const metadata: Metadata = {
  title: "Destinations",
  description:
    "Every place Outway Club runs small-group escapes, and the ones we're planning next. Rajasthan and beyond, each destination researched on the ground before it goes on sale.",
  alternates: { canonical: "/destinations" },
};

export const revalidate = 300;

/**
 * The hub for `/destinations/[slug]`.
 *
 * Detail pages existed and were linked from trips, the homepage explorer and
 * breadcrumbs, but there was no page at `/destinations` itself — so the section
 * had no root to link to, and crawlers reached each place only through whatever
 * trip happened to mention it. This is that root.
 */
export default async function DestinationsPage() {
  const destinations = await getDestinationsWithAvailability();

  const running = destinations.filter((destination) => destination.tripCount > 0);
  const planned = destinations.filter((destination) => destination.tripCount === 0);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Destinations", path: "/destinations" },
        ]}
      />

      <Container className="section-sm">
        <div className="max-w-2xl">
          <Eyebrow className="mb-2.5">Where we go</Eyebrow>
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Every place we run an escape
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-500">
            We go back to the same handful of places until we know them properly — which road is
            worth the extra hour, which stay is worth the extra rupee, which month it stops being
            pleasant. A destination only appears here once someone from Outway has actually been.
          </p>
        </div>

        {running.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold text-ink">Open for booking</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {running.map((destination, index) => (
                <Reveal key={destination.id} delay={Math.min(index, 5) * 70}>
                  <DestinationCard destination={destination} tripCount={destination.tripCount} />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {planned.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-semibold text-ink">In the works</h2>
            <p className="mt-2 max-w-[38rem] text-ink-500">
              Researched, not yet on sale. Nothing goes live here until every night and transfer is
              booked, so these carry a date when they carry a date.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {planned.map((destination, index) => (
                <Reveal key={destination.id} delay={Math.min(index, 5) * 70}>
                  <DestinationCard destination={destination} tripCount={destination.tripCount} />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {destinations.length === 0 && (
          <p className="mt-12 rounded-2xl border border-dashed border-border bg-cream-300 p-6 text-ink-500">
            No destinations published yet.
          </p>
        )}

        <section className="mt-16 rounded-3xl bg-pine px-6 py-10 sm:px-10">
          <div className="max-w-xl">
            <Eyebrow tone="dark" className="mb-2.5">
              Somewhere else in mind?
            </Eyebrow>
            <h2 className="font-display text-2xl font-semibold text-cream-100 sm:text-3xl">
              Tell us where you want to go
            </h2>
            <p className="mt-3 text-cream-100/75">
              We plan one escape at a time and the list above is where we&apos;re looking next. If
              you want a place on it, say so — or leave your email and hear first when the next one
              opens.
            </p>
            <div className="mt-6">
              <NewsletterForm source="trips" />
            </div>
            <Link
              href="/contact"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:underline"
            >
              Or just write to us <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
