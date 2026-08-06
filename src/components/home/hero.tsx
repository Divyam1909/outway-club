import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Users, Star } from "lucide-react";
import { Container } from "@/components/ui/container";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-pine-700">
      <Image
        src="https://picsum.photos/seed/outway-hero/1920/1200"
        alt="Mountain valley at sunrise"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-pine-700 via-pine-700/60 to-pine-700/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-pine-700/70 via-transparent to-transparent" />

      <Container className="relative flex min-h-[36rem] flex-col justify-center py-20 sm:min-h-[42rem]">
        <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-cream-100/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cream-100 backdrop-blur">
          Small groups · Full itineraries · Real trip leaders
        </p>
        <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.1] text-cream-100 sm:text-5xl lg:text-6xl">
          Trips worth leaving home for.
        </h1>
        <p className="mt-5 max-w-xl text-base text-cream-100/85 sm:text-lg">
          Curated group departures and private itineraries across India — planned down to the
          last detail, priced honestly, led by people who know the ground.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/trips" className="btn-accent px-7 py-3.5 text-base">
            Explore trips <ArrowRight size={18} />
          </Link>
          <Link href="/group-trips" className="btn px-7 py-3.5 text-base text-cream-100 border border-cream-100/30 hover:bg-cream-100/10">
            See group departures
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-cream-100/80">
          <span className="flex items-center gap-2">
            <Users size={16} className="text-gold" /> 50,000+ travellers
          </span>
          <span className="flex items-center gap-2">
            <Star size={16} className="text-gold" /> 4.8 average rating
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-gold" /> Trip leader on every departure
          </span>
        </div>
      </Container>
    </section>
  );
}
