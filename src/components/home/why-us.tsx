import { Compass, Users2, ShieldCheck, Wallet } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const POINTS = [
  {
    icon: Compass,
    title: "Itineraries, not outlines",
    body: "Every trip comes with a full day-by-day plan before you book — meals, stays and activities included, no surprises on the ground.",
  },
  {
    icon: Users2,
    title: "Genuinely small groups",
    body: "Most departures cap between 12–20 travellers, so it never feels like you're being herded through a checklist.",
  },
  {
    icon: Wallet,
    title: "Transparent pricing",
    body: "What you see is what you pay. Inclusions and exclusions are spelled out on every trip page, always.",
  },
  {
    icon: ShieldCheck,
    title: "A trip leader, always",
    body: "Every group departure travels with an experienced local trip leader — not just a driver.",
  },
];

export function WhyUs() {
  return (
    <section className="bg-cream-100 py-20">
      <Container>
        <SectionHeading
          eyebrow="Why Outway Club"
          title="Travel planning, minus the guesswork"
          description="We built Outway Club around the questions people actually ask before booking — what exactly is included, who's leading the trip, and what does each day look like."
        />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((point) => (
            <div key={point.title} className="rounded-2xl border border-border bg-white p-6 shadow-soft">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-pine-50 text-pine">
                <point.icon size={22} />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-ink">{point.title}</h3>
              <p className="text-sm text-ink-500">{point.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
