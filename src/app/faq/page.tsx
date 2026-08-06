import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "FAQs" };

const FAQS = [
  {
    q: "How do group departures work?",
    a: "Each group trip has a set of fixed departure dates with a capped number of seats. Once you book, your seat is confirmed immediately — there's no waiting for a batch to fill up before it's guaranteed to run.",
  },
  {
    q: "What's included in the price shown?",
    a: "Every trip page has a full inclusions and exclusions list — typically accommodation, listed meals, transport during the trip, permits, and a trip leader. Flights to the starting point and personal expenses are usually excluded. Check the specific trip page for exact details.",
  },
  {
    q: "Can I customize a group trip into a private one?",
    a: "Yes. Use the \"Enquire\" option on any trip page, or get in touch through Contact, and we'll build a private itinerary around your dates and preferences.",
  },
  {
    q: "What happens if a departure gets cancelled?",
    a: "In the rare case a minimum group size isn't met, we'll notify you at least 15 days before departure with a full refund or the option to shift to another date.",
  },
  {
    q: "Is travel insurance included?",
    a: "No — we strongly recommend arranging your own travel insurance before departure, especially for high-altitude and adventure trips.",
  },
  {
    q: "How do I pay, and is it secure?",
    a: "Payments are processed through Razorpay, supporting UPI, cards and netbanking. We never store your card details.",
  },
  {
    q: "Can I see who else is on my group departure?",
    a: "For privacy reasons we don't share traveler lists in advance, but our trip leaders are excellent at breaking the ice on day one.",
  },
];

export default function FaqPage() {
  return (
    <div className="py-16">
      <Container className="max-w-3xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-clay">Support</p>
        <h1 className="font-display text-4xl font-semibold text-ink">Frequently asked questions</h1>
        <p className="mt-3 text-ink-500">
          Can&apos;t find what you&apos;re looking for?{" "}
          <a href="/contact" className="font-medium text-pine hover:underline">
            Get in touch
          </a>
          .
        </p>

        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-white">
          {FAQS.map((item) => (
            <details key={item.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink">
                {item.q}
                <ChevronDown size={18} className="shrink-0 text-ink-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </div>
  );
}
