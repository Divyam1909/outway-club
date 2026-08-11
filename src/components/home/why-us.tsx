import { CalendarCheck, Route, Users2, Wallet } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

const POINTS = [
  {
    icon: Route,
    title: "Built one at a time",
    body: "We don't buy itineraries off a wholesaler. Every escape is walked, driven and eaten before it goes on sale, and it doesn't go on sale until it's finished.",
  },
  {
    icon: Users2,
    title: "Small group, hard cap",
    body: "Not 'small group' as a marketing word. One vehicle, one table at dinner. When the seats are gone the departure closes rather than growing.",
  },
  {
    icon: CalendarCheck,
    title: "Booked before you book",
    body: "Hotels, transport and permits are confirmed before a seat goes on sale. Your booking isn't a promise we'll try to arrange something, it's a seat on a trip that already exists.",
  },
  {
    icon: Wallet,
    title: "One price, taxes in",
    body: "What you see is what you pay. Every inclusion and exclusion is listed on the trip page, and there's no convenience fee waiting at checkout.",
  },
];

export function WhyUs() {
  return (
    <section className="section-lg">
      <Container>
        <SectionHeading
          eyebrow="Why Outway"
          title="We kept getting sold the wrong trip, so we built this one"
          description="Every group trip we'd booked before this had the same problems: a vague itinerary, a bus that kept filling up, and a price that grew at checkout. We fixed those four things first, and built everything else around them."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((point, index) => (
            <Reveal key={point.title} delay={index * 80}>
              <div className="card-lift h-full rounded-2xl border border-border bg-white p-6 shadow-soft">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-pine-50 text-pine">
                  <point.icon size={22} />
                </div>
                <h3 className="mb-2 heading-sm text-lg text-ink">{point.title}</h3>
                <p className="text-sm leading-relaxed text-ink-500">{point.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
