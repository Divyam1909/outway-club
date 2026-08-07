import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { site, whatsappLink } from "@/config/site";

export function CtaBanner() {
  const whatsapp = whatsappLink("Hi — I have a question about Escape 001 (Udaipur × Mount Abu).");

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-border bg-cream-100 px-8 py-12 shadow-soft sm:px-14 sm:py-16">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
                Still deciding?
              </p>
              <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
                Ask us anything before you pay.
              </h2>
              <p className="mx-auto mt-4 max-w-lg leading-relaxed text-ink-500">
                Room sharing, how fit you need to be, whether the drive is bad in monsoon, what
                happens if your flight is late. A real person answers, usually within{" "}
                {site.responseTime}.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/contact" className="btn-accent px-7 py-3.5">
                  Send us a question <ArrowRight size={17} />
                </Link>
                {whatsapp ? (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline px-7 py-3.5"
                  >
                    <MessageCircle size={17} /> WhatsApp us
                  </a>
                ) : (
                  <a href={`mailto:${site.email}`} className="btn-outline px-7 py-3.5">
                    {site.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
