import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Route, ShieldCheck, Users2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { SmartImage } from "@/components/ui/smart-image";
import { Eyebrow } from "@/components/ui/eyebrow";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Outway Club isn't a weekend-trip company. The trips are the way in. What we're building is a different way to travel across India: small groups, real people, and journeys you remember for who was on them.",
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
    body: "It's the number where a group still fits around one table and a host still knows what everyone needs. When a departure fills, it closes. We don't add a second vehicle.",
  },
  {
    icon: CalendarCheck,
    title: "Empty hours are in the plan",
    body: "A packed schedule is the easiest thing in this industry to sell and the hardest to live through. We leave whole afternoons open on purpose. If that looks like poor value on a comparison table, we're comfortable with that.",
  },
  {
    icon: ShieldCheck,
    title: "Nothing invented",
    body: "No stock reviews, no borrowed photography passed off as ours, no traveller counts we can't evidence, and never a wildlife sighting promised. Right now that means some pages on this site are near-empty. We'd rather that than the alternative.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="relative flex h-[24rem] items-end overflow-hidden sm:h-[28rem]">
        <SmartImage
          src="/images/outway/the-table.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          fallbackLabel="The Outway table"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-transparent" />
        <Container className="relative pb-12 text-cream-100">
          <Eyebrow tone="dark" className="mb-3">
            About Outway Club
          </Eyebrow>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
            {site.taglineLong}
          </h1>
        </Container>
      </section>

      <Container className="section">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Why this exists"
              title="We are not a weekend-trip company. The trips are the way in."
              description="Most trip listings tell you where you're going and almost nothing else. No real day plan. Inclusions that turn out to be exclusions. A group that quietly grows until every stop is a queue. And a price that isn't the price until you reach checkout."
            />

            <div className="mt-8 space-y-4 leading-relaxed text-ink-500">
              <p>
                Outway Club started as a reaction to that. The first thing we wrote wasn&apos;t a
                brand or a website, it was an itinerary — hour by hour, with the stays already
                booked and every cost written down. Then we worked backwards and built a company
                that could sell exactly that and nothing more.
              </p>
              <p>
                Somewhere in the first few departures the actual product turned out to be
                something else. People did not come home talking about the forts. They came home
                talking about the shepherd who explained his own hills, the table on the last
                night, and the four strangers they were still messaging in November. So we
                stopped designing trips and started designing journeys around that: fewer places,
                longer in each, and real time with the people who live there.
              </p>
              <p>
                That is the whole plan. No franchise, no thirty-destination catalogue, no
                &ldquo;packages starting from&rdquo;. A handful of journeys a year, each one run
                properly, each one small enough that we can stand behind it. After every
                departure we publish the reviews unedited, including the bad ones, and start on
                the next.
              </p>
            </div>

            <Link href="/trips" className="btn-primary btn-lg mt-9">
              See every escape <ArrowRight size={17} />
            </Link>
          </div>

          <Reveal delay={100}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-lifted">
              <SmartImage
                src="/images/outway/story-circle.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
                fallbackLabel="The Story Circle"
              />
            </div>
          </Reveal>
        </div>
      </Container>

      <section className="bg-cream-300 section">
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
                  <h3 className="mb-2 heading-sm text-lg text-ink">
                    {principle.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-500">{principle.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ---- Where this goes ------------------------------------------------
          The long-term model, said plainly rather than kept as an internal
          strategy note. Right now every departure is Indian travellers meeting
          Indian places. The version we are building is the same journey with
          travellers from several countries on it — which is a genuinely
          different product from a foreign-tourist tour, because the exchange
          runs both ways. It is also the one thing here a competitor cannot
          copy by rewriting a landing page. */}
      <section className="bg-pine-700 section text-cream-100">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
            <div>
              <Eyebrow tone="dark" className="mb-3">
                Where this goes
              </Eyebrow>
              <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
                One journey. Travellers from several countries.{" "}
                <span className="italic text-gold">Both directions.</span>
              </h2>

              <div className="mt-6 space-y-4 leading-relaxed text-cream-100/75">
                <p>
                  Today an Outway escape is Indian travellers meeting Indian places. The version
                  we are building puts Indian and international travellers on the same journey —
                  the same jeep, the same table, the same question round the same fire.
                </p>
                <p>
                  Someone flying in gets India through Indian people, food, stories and homes
                  rather than through a hotel lobby and a guide with a flag. And the Indians on
                  that trip get the other half of it: five days of conversation with people whose
                  lives look nothing like theirs. That exchange is not a side effect we tolerate.
                  It is the thing we are building the company around.
                </p>
                <p className="text-cream-100/85">
                  A route can be copied in a week. A group of people who genuinely want to meet
                  each other cannot be.
                </p>
              </div>
            </div>

            <Reveal delay={120}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lifted">
                <SmartImage
                  src="/images/outway/the-road.jpg"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                  fallbackLabel="The road between two worlds"
                />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <Container className="section">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-2xl italic leading-snug text-ink sm:text-3xl">
              &ldquo;You came for the destination. You leave remembering the people.&rdquo;
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-border bg-white p-8 text-center shadow-soft sm:p-10">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Want to know something we haven&apos;t said here?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
              Ask us anything about how we operate, who we book with, or where the money goes.
              We&apos;ll answer straight.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/contact" className="btn-primary">
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
