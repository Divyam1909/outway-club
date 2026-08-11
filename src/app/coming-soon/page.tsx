import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { Container } from "@/components/ui/container";
import { NewsletterForm } from "@/components/newsletter-form";
import { Eyebrow } from "@/components/ui/eyebrow";

export const metadata: Metadata = {
  title: "Coming soon",
  description: "This escape is still being planned end to end. Leave your email and hear before anyone else.",
  robots: { index: false, follow: false },
};

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const place = one(params.place);

  return (
    <div className="flex min-h-[70vh] items-center section-lg">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-clay-50 text-clay">
            <Compass size={26} />
          </span>

          <Eyebrow className="mb-3">
            {place ? place : "In the works"}
          </Eyebrow>
          <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            {place ? `${place} is being planned, not sold yet.` : "This one is still being planned."}
          </h1>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-500">
            We do not put a route on sale until every night, transfer and meal on it is genuinely
            booked. Leave your email and you will hear the moment it goes live, before it is
            announced anywhere else.
          </p>

          <div className="mx-auto mt-8 max-w-sm">
            <NewsletterForm source="coming-soon" variant="light" buttonLabel="Notify me" />
          </div>

          <div className="mt-8">
            <Link href="/trips" className="btn-outline px-7 py-3.5">
              See what is open now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
