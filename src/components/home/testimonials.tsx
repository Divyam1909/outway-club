import Link from "next/link";
import { Quote } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { RatingStars } from "@/components/ui/rating-stars";
import type { Review, Trip } from "@/lib/types";

export function Testimonials({
  reviews,
}: {
  reviews: (Review & { trip: Pick<Trip, "title" | "slug"> })[];
}) {
  if (reviews.length === 0) return null;

  return (
    <section className="bg-pine-700 py-20">
      <Container>
        <SectionHeading
          eyebrow="Traveller stories"
          title="What it's actually like on an Outway trip"
          align="center"
          className="mx-auto text-cream-100 [&_p]:text-cream-100/70"
        />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-col rounded-2xl border border-cream-100/10 bg-cream-100/5 p-6"
            >
              <Quote className="mb-3 text-gold" size={22} />
              <RatingStars rating={review.rating} />
              {review.title && (
                <p className="mt-3 font-display text-lg font-semibold text-cream-100">
                  {review.title}
                </p>
              )}
              <p className="mt-2 flex-1 text-sm leading-relaxed text-cream-100/75">
                {review.body}
              </p>
              <div className="mt-5 border-t border-cream-100/10 pt-4">
                <p className="text-sm font-semibold text-cream-100">{review.author_name}</p>
                <Link
                  href={`/trips/${review.trip.slug}`}
                  className="text-xs text-gold hover:underline"
                >
                  {review.trip.title}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
