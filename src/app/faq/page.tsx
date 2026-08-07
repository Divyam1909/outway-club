import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Everything people ask before booking Escape 001 — Udaipur × Mount Abu: rooms, fitness, monsoon, payment, refunds and what happens if your flight is late.",
  alternates: { canonical: "/faq" },
};

const GROUPS = [
  {
    heading: "Escape 001 — Udaipur × Mount Abu",
    faqs: [
      {
        q: "What exactly are the dates, and when should I book travel?",
        a: "The escape runs 15–17 August. Day 1 starts in Udaipur late morning, so land or arrive before midday on the 15th. Day 3 ends with an airport and station drop by 6pm on the 17th, so anything departing after 8pm is comfortable. Don't book a flight out before 8pm.",
      },
      {
        q: "August is monsoon — isn't that a bad time to go?",
        a: "It's the reason we picked it. The Aravallis are green for roughly one month a year and this is it. Rajasthan's monsoon is intermittent showers rather than continuous rain, temperatures drop to the mid-twenties, and the lakes are actually full. Bring a rain jacket and you'll have the best version of this route.",
      },
      {
        q: "How fit do I need to be?",
        a: "Not very. This is rated easy. The most demanding parts are walking around fort and temple complexes and an early start for the Guru Shikhar sunrise. There is no trekking, no altitude to speak of, and the longest single stretch of walking is under two kilometres on flat ground.",
      },
      {
        q: "Who am I sharing a room with?",
        a: "Prices are on twin sharing and we pair you with someone of the same gender from the group. If you're booking as a couple or a pair of friends you'll be together. If you'd rather have the room to yourself, email us and we'll quote the single-occupancy supplement.",
      },
      {
        q: "How big is the group, really?",
        a: "Eighteen, hard cap. One vehicle, one table at dinner. When the seats are gone the departure closes — we don't add a second bus or upgrade to a bigger coach.",
      },
      {
        q: "I'm travelling solo. Is that going to be awkward?",
        a: "Most people on a first escape book solo. Eighteen is small enough that you'll know everyone's name by the first dinner, and your trip captain's job on day one is largely to make sure that happens.",
      },
      {
        q: "What food is included?",
        a: "Both breakfasts, and two dinners — the rooftop dinner at Ambrai Ghat on night one and the bonfire dinner in Mount Abu on night two. Lunches are not included, deliberately: it keeps the day flexible and lets you eat what you actually want. Budget roughly ₹400–600 per lunch.",
      },
      {
        q: "Is there anything I have to bring?",
        a: "Original government photo ID is mandatory — Indian hotels are legally required to record it at check-in and we cannot get you a room without it. A photocopy or a photo on your phone is not enough. Beyond that, a rain jacket and one warm layer for Mount Abu evenings.",
      },
    ],
  },
  {
    heading: "Booking and payment",
    faqs: [
      {
        q: "How do I pay, and is it secure?",
        a: "Through Razorpay, which supports UPI, credit and debit cards, netbanking and wallets. Your card details go directly from your browser to Razorpay — they never touch our servers and we never store them.",
      },
      {
        q: "Is the price really the final price?",
        a: "Yes. The figure on the trip page is per person, inclusive of all applicable taxes, and it's what you'll be charged. There is no convenience fee, booking fee or service charge added at checkout.",
      },
      {
        q: "What confirms my seat?",
        a: "Full payment. The moment it clears you'll get a confirmation email with a booking reference, and the booking appears in your account on this site. Nothing is held for you before payment — seat counts on the site are live but not reserved.",
      },
      {
        q: "When do I get the joining details?",
        a: "A few days before departure we email the exact reporting point, timings, your trip captain's phone number, the hotel addresses and a final packing note.",
      },
    ],
  },
  {
    heading: "Changes, cancellations and the unexpected",
    faqs: [
      {
        q: "What do I get back if I cancel?",
        a: "90% if you cancel 15 or more days before departure, 50% between 7 and 14 days, and nothing inside 7 days — that last window is when our hotels and transport stop refunding us. You can cancel yourself from My bookings and you'll see the exact figure before you confirm.",
      },
      {
        q: "What if you cancel the trip?",
        a: "You get 100% of what you paid us back, with no deduction, or a transfer to another departure — your choice. We'll tell you as early as we possibly can. We can't reimburse flights you booked separately, which is why we suggest refundable tickets or travel insurance.",
      },
      {
        q: "Can I send someone else in my place?",
        a: "Yes, up to 7 days before departure at no charge, as long as they accept our terms and carry valid ID. If a supplier charges us for the name change we'll pass on the actual cost with the invoice.",
      },
      {
        q: "My flight is delayed and I'll miss day 1. What happens?",
        a: "Call your trip captain — the number is in your joining email. We'll tell you where the group is and how to catch up, and we'll help you arrange the transfer, though the cost of that is yours. We can't hold a group of eighteen at a hotel, but nobody gets left behind either.",
      },
      {
        q: "Is travel insurance included?",
        a: "No, and we'd genuinely recommend arranging your own. It's inexpensive and it covers exactly the things our refund policy can't — a medical emergency, a cancelled flight, or losing a bag.",
      },
    ],
  },
  {
    heading: "About Outway",
    faqs: [
      {
        q: "Why is there only one trip on the site?",
        a: "Because we only run one at a time. We'd rather plan a single weekend obsessively than list twenty destinations we've half-researched. Escape 002 goes live when every night, transfer and meal on it is genuinely booked.",
      },
      {
        q: "Why are there no reviews on the site?",
        a: "Because nobody has travelled with us yet. Escape 001 is our first departure. We could have filled the page with stock photos and invented names — plenty of sites do — but the first real review will be worth more than fifty fake ones.",
      },
      {
        q: "Can I get a custom or private version of this trip?",
        a: "Ask us. Write to us through the contact page with your dates and group size and we'll tell you honestly whether we can do it well. If we can't, we'll say so rather than take the booking.",
      },
    ],
  },
];

const ALL_FAQS = GROUPS.flatMap((group) => group.faqs);

export default function FaqPage() {
  return (
    <div className="py-14 sm:py-20">
      <Container className="max-w-3xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-clay">Support</p>
        <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
          Questions people actually ask
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-500">
          If it isn&apos;t here,{" "}
          <Link href="/contact" className="font-medium text-pine underline underline-offset-2">
            ask us directly
          </Link>{" "}
          — a person replies within {site.responseTime}.
        </p>

        <div className="mt-12 space-y-12">
          {GROUPS.map((group) => (
            <section key={group.heading}>
              <h2 className="mb-4 font-display text-xl font-semibold text-ink">{group.heading}</h2>
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
                {group.faqs.map((item) => (
                  <details key={item.q} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-medium text-ink transition-colors hover:bg-cream-300/40">
                      {item.q}
                      <ChevronDown
                        size={18}
                        aria-hidden="true"
                        className="shrink-0 text-ink-400 transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <p className="px-5 pb-5 text-sm leading-relaxed text-ink-500">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-3xl bg-pine-700 p-8 text-center text-cream-100 sm:p-10">
          <h2 className="font-display text-2xl font-semibold">Still not sure?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream-100/75">
            We&apos;d rather answer three more questions than have you book something that
            isn&apos;t right for you.
          </p>
          <Link href="/contact" className="btn-accent mt-6">
            Ask a question
          </Link>
        </div>
      </Container>

      <FaqJsonLd faqs={ALL_FAQS} />
    </div>
  );
}
