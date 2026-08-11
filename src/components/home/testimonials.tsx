import Link from "next/link";
import { ArrowRight, Quote, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { RatingStars } from "@/components/ui/rating-stars";
import { Reveal } from "@/components/ui/reveal";
import type { ReviewWithTrip } from "@/lib/data";

export function Testimonials({ reviews }: { reviews: ReviewWithTrip[] }) {
  const hasReviews = reviews.length > 0;

  return (
    <section className="bg-pine-700 section-lg">
      <Container>
        <SectionHeading
          eyebrow="Traveller stories"
          title={hasReviews ? "In their words, not ours" : "This page is empty on purpose"}
          align="center"
          tone="dark"
          description={
            hasReviews
              ? "Every review below was written by someone who paid for a seat and travelled with us. We publish them unedited, including the critical ones."
              : "Nobody has come back from a trip with us yet. We'd rather show you nothing than invent a quote. This page fills up the week after our first departure returns."
          }
        />

        {hasReviews ? (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, index) => (
              <Reveal key={review.id} delay={index * 90}>
                <figure className="flex h-full flex-col rounded-2xl border border-cream-100/10 bg-cream-100/5 p-6">
                  <Quote className="mb-3 text-gold" size={22} aria-hidden="true" />
                  <RatingStars rating={review.rating} />
                  {review.title && (
                    <p className="mt-3 heading-sm text-lg text-cream-100">
                      {review.title}
                    </p>
                  )}
                  <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-cream-100/75">
                    {review.body}
                  </blockquote>
                  <figcaption className="mt-5 border-t border-cream-100/10 pt-4">
                    <span className="block text-sm font-semibold text-cream-100">
                      {review.author_name}
                    </span>
                    {review.trip && (
                      <Link
                        href={`/trips/${review.trip.slug}`}
                        className="text-xs text-gold hover:underline"
                      >
                        {review.trip.title}
                      </Link>
                    )}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-cream-100/12 bg-cream-100/5 p-8 text-center sm:p-10">
            <ShieldCheck className="mx-auto mb-4 text-gold" size={28} />
            <p className="heading-sm text-xl text-cream-100">
              How reviews work here
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream-100/70">
              Only travellers with a paid booking on a departure that has already run can post a
              review, and the rule is enforced in code, not in policy. We never write reviews, buy
              them, or delete one for being unkind.
            </p>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/testimonials"
            className="btn border border-cream-100/25 text-cream-100 hover:bg-cream-100/10"
          >
            {hasReviews ? "Read every review" : "How we handle reviews"}{" "}
            <ArrowRight size={16} />
          </Link>
        </div>
      </Container>
    </section>
  );
}
