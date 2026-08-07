import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Route, ShieldCheck, Users2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { SmartImage } from "@/components/ui/smart-image";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Outway Club runs one small-group escape at a time across India, planned end to end, capped at 18 travellers, priced with taxes in.",
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  {
    icon: Route,
    title: "If it isn't planned, it isn't for sale",
    body: "Every night, transfer, entry ticket and included meal is booked before a seat goes live. A trip page on this site describes something that already exists, not something we'll assemble once enough people pay.",
  },
  {
    icon: Users2,
    title: "Eighteen is a real limit",
    body: "It's the number where a group still fits around one table and a trip captain still knows what everyone needs. When a departure fills, it closes. We don't add a second vehicle.",
  },
  {
    icon: CalendarCheck,
    title: "One escape at a time",
    body: "A catalogue of forty destinations means forty itineraries nobody has walked. We run one, learn from it, and start the next. It's slower and it's the whole point.",
  },
  {
    icon: ShieldCheck,
    title: "Nothing invented",
    body: "No stock reviews, no borrowed photography passed off as ours, no traveller counts we can't evidence. Right now that means some pages on this site are near-empty. We'd rather that than the alternative.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="relative flex h-[24rem] items-end overflow-hidden sm:h-[28rem]">
        <SmartImage
          src="/images/escape-001/gallery-2.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          fallbackLabel="Outway Club"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-transparent" />
        <Container className="relative pb-12 text-cream-100">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            About Outway Club
          </p>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
            We got tired of vague itineraries, so we wrote a proper one.
          </h1>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Why this exists"
              title="Most trip listings tell you where you're going and almost nothing else"
              description="No real day plan. Inclusions that turn out to be exclusions. A group size that quietly grows until every stop is a queue. And a price that isn't the price until you reach checkout."
            />

            <div className="mt-8 space-y-4 leading-relaxed text-ink-500">
              <p>
                Outway Club started as a reaction to that. The first thing we wrote wasn&apos;t a
                brand or a website, it was a three-day itinerary for Udaipur and Mount Abu, hour by
                hour, with the stays already booked and every cost written down. Then we worked
                backwards and built a company that could sell exactly that and nothing more.
              </p>
              <p>
                Escape 001 was that itinerary. Everything we&apos;ve added since gets built the
                same way: walked, driven and eaten before it goes on sale, then run small enough
                that we can actually stand behind it. After each one we publish the reviews
                unedited, including the bad ones, and start on the next.
              </p>
              <p>
                That&apos;s the entire plan. No franchise, no thirty-destination catalogue, no
                &ldquo;packages starting from&rdquo;. A handful of trips a year, each one run
                properly.
              </p>
            </div>

            <Link href="/trips" className="btn-accent mt-9 px-7 py-3.5">
              See every escape <ArrowRight size={17} />
            </Link>
          </div>

          <Reveal delay={100}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-lifted">
              <SmartImage
                src="/images/escape-001/gallery-3.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
                fallbackLabel="Mount Abu"
              />
            </div>
          </Reveal>
        </div>
      </Container>

      <section className="bg-cream-100 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="How we work"
            title="Four rules we don't bend"
            align="center"
            className="mx-auto"
          />

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {PRINCIPLES.map((principle, index) => (
              <Reveal key={principle.title} delay={index * 90}>
                <div className="h-full rounded-2xl border border-border bg-white p-7 shadow-soft">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-pine-50 text-pine">
                    <principle.icon size={21} />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-ink">
                    {principle.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-500">{principle.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <Reveal>
          <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-white p-8 text-center shadow-soft sm:p-10">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Want to know something we haven&apos;t said here?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
              Ask us anything about how we operate, who we book with, or where the money goes.
              We&apos;ll answer straight.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/contact" className="btn-accent">
                Get in touch
              </Link>
              <a href={`mailto:${site.email}`} className="btn-outline">
                {site.email}
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
