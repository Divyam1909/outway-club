import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

/**
 * The five pillars every escape is designed against.
 *
 * These are not values in the poster sense — each one is a design constraint
 * that removes something from a trip. "Curate the journey instead of filling
 * every minute" is why Day 02 has an empty afternoon; "participate rather than
 * observe" is why we sit down with a Rabari family rather than driving past
 * one. If a pillar isn't cutting anything, it isn't a pillar.
 *
 * People is first because the other four serve it. The order is the argument.
 */
const PILLARS = [
  {
    name: "People",
    line: "You come for the destination. You remember the people.",
    body: "The travellers beside you, the shepherd who explains his own hills, the naturalist who knows which family of leopards is where. We build around them first and fit the sightseeing in afterwards.",
  },
  {
    name: "Place",
    line: "Understand a place, don't just visit it.",
    body: "Two days in one landscape rather than six towns from a moving vehicle. Long enough that you stop taking photographs of everything and start noticing what is actually there.",
  },
  {
    name: "Culture",
    line: "Participate, don't observe from outside.",
    body: "Eat what is cooked here, sit where people sit, and go where you have actually been invited. Never a staged performance with a ticket price and a photo opportunity at the end.",
  },
  {
    name: "Experience",
    line: "Curate the journey, don't fill every minute.",
    body: "Empty hours are in the plan, not missing from it. An escape that leaves you needing a holiday afterwards was designed by somebody counting activities.",
  },
  {
    name: "Connection",
    line: "Arrive with strangers. Leave with stories.",
    body: "Every evening has a question in it and every group has a table. You do not have to know anybody before you come — that is the entire point, and it is the thing people write to us about afterwards.",
  },
];

export function Pillars() {
  return (
    <section className="section-lg">
      <Container>
        <SectionHeading
          eyebrow="How an escape is designed"
          title="Five things decide what goes in, and what gets left out"
          description="Every one of these removes something. That's how you can tell they're real: a value that never costs you an activity, a stop or a booking isn't a value, it's a poster."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar, index) => (
            <Reveal key={pillar.name} delay={index * 70}>
              <div className="card-lift flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-soft">
                <span className="eyebrow text-clay-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-2xl font-semibold text-ink">
                  {pillar.name}
                </h3>
                <p className="mt-2 font-display text-base italic leading-snug text-pine">
                  {pillar.line}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-500">{pillar.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
