import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export function CtaBanner() {
  return (
    <section className="py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl">
          <Image
            src="https://picsum.photos/seed/outway-cta/1600/700"
            alt="Traveller looking at a mountain view"
            width={1600}
            height={700}
            className="h-[24rem] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-14">
            <h2 className="max-w-md font-display text-3xl font-semibold text-cream-100 sm:text-4xl">
              Can&apos;t find the trip you had in mind?
            </h2>
            <p className="mt-3 max-w-sm text-cream-100/85">
              Tell us where you want to go and how you like to travel — we&apos;ll build a
              private itinerary around it.
            </p>
            <Link href="/contact" className="btn-accent mt-6 w-fit px-7 py-3.5">
              Start a custom trip
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
