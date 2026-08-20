import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Eyebrow } from "@/components/ui/eyebrow";
import { site } from "@/config/site";

/**
 * What Outway is actually arguing.
 *
 * Four preferences, stated as comparisons, because a comparison commits to
 * something a list of adjectives cannot: choosing people over places means
 * genuinely spending a morning with a Rabari family instead of a fifth fort,
 * and it is a promise a reader can hold us to.
 *
 * The heading takes the spotlight escape's region so it reads as a claim about
 * somewhere real rather than a slogan. With nothing on sale it falls back to
 * the general form, which is still true and still ours.
 */
const PREFERENCES = [
  {
    over: "People",
    under: "Places",
    body: "A place is the reason you booked. The people are the reason you remember it, and the reason two of you are still texting in November.",
  },
  {
    over: "Stories",
    under: "Sightseeing",
    body: "Anyone can stand in front of a fort. We would rather you left knowing why the Rabari have never hunted a leopard, told to you by somebody whose grandfather didn't either.",
  },
  {
    over: "Experiences",
    under: "Itineraries",
    body: "A full schedule is easy to sell and exhausting to live. We leave whole afternoons empty on purpose, because that is where a trip turns into a journey.",
  },
  {
    over: "Community",
    under: "Customers",
    body: "You arrive not knowing anyone. You leave on a group thread that stays open. Nothing about that fits on an invoice, and it is the actual product.",
  },
];

export function BrandFoundation({ region }: { region?: string | null }) {
  return (
    <section className="bg-pine-700 section-lg text-cream-100">
      <Container>
        <div className="max-w-3xl">
          <Eyebrow tone="dark" className="mb-3">
            What we&apos;re actually building
          </Eyebrow>
          <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            You don&apos;t just visit {region ?? "a place"}.{" "}
            <span className="italic text-gold">You experience it.</span>
          </h2>
          <p className="mt-5 max-w-[38rem] leading-relaxed text-cream-100/75">
            Outway isn&apos;t a weekend-trip company that happens to run escapes. The trips are
            the way in. What we&apos;re building is a different way to travel — and four
            preferences decide every call we make, from who we eat with to what we leave out.
          </p>
        </div>

        <dl className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
          {PREFERENCES.map((item, index) => (
            <Reveal key={item.over} delay={index * 80}>
              <div className="border-t border-cream-100/15 pt-5">
                <dt className="font-display text-2xl font-semibold sm:text-[1.75rem]">
                  {item.over}{" "}
                  <span className="text-gold">&gt;</span>{" "}
                  <span className="text-cream-100/40 line-through decoration-cream-100/25">
                    {item.under}
                  </span>
                </dt>
                <dd className="mt-3 text-sm leading-relaxed text-cream-100/70">{item.body}</dd>
              </div>
            </Reveal>
          ))}
        </dl>

        <div className="mt-12 flex flex-col items-start gap-5 border-t border-cream-100/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-lg italic text-cream-100/85 sm:text-xl">
            {site.taglineLong}
          </p>
          <Link href="/about" className="btn-accent shrink-0">
            How we work <ArrowRight size={16} />
          </Link>
        </div>
      </Container>
    </section>
  );
}
