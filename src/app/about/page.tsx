import type { Metadata } from "next";
import Image from "next/image";
import { Compass, Users2, ShieldCheck, Heart } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = { title: "About us" };

const VALUES = [
  { icon: Compass, title: "Plan properly, or don't run it", body: "If a trip doesn't have a full day-by-day itinerary, it doesn't go live on the site. That's the whole philosophy." },
  { icon: Users2, title: "Small groups, on purpose", body: "We cap most departures well below what a bus can hold, because that's the difference between a tour and a trip." },
  { icon: ShieldCheck, title: "A real person on the ground", body: "Every group departure travels with a trip leader who knows the route, the people, and what to do when plans change." },
  { icon: Heart, title: "Built by people who travel this way", body: "Outway Club started because the trips we wanted to take weren't the ones being sold to us." },
];

export default function AboutPage() {
  return (
    <div>
      <section className="relative flex h-[22rem] items-end">
        <Image
          src="https://picsum.photos/seed/outway-about/1920/900"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
        <Container className="relative pb-10 text-cream-100">
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">About Outway Club</h1>
        </Container>
      </section>

      <Container className="py-16">
        <div className="max-w-2xl">
          <SectionHeading
            eyebrow="Our story"
            title="We got tired of vague itineraries"
            description="Outway Club started with a simple complaint: most trip listings tell you where you're going and not much else. No real day plan, unclear inclusions, and a group size that turns every stop into a queue. We build the trip we'd actually want to take — planned properly, priced honestly, and small enough to still feel personal."
          />
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => (
            <div key={value.title} className="rounded-2xl border border-border bg-white p-6 shadow-soft">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-pine-50 text-pine">
                <value.icon size={22} />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-ink">{value.title}</h3>
              <p className="text-sm text-ink-500">{value.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
