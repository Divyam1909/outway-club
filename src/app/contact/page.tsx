import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { ContactForm } from "@/components/contact-form";
import { getTripBySlug } from "@/lib/data";
import { site, whatsappLink } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Questions about a departure, room sharing, custom dates or an existing booking. Write to Outway Club and a person replies within one business day.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ trip?: string }>;
}) {
  const { trip: tripSlug } = await searchParams;
  const trip = tripSlug ? await getTripBySlug(tripSlug) : null;
  // Deep-linked from a trip page (?trip=slug), the WhatsApp draft names that
  // trip; otherwise it stays generic.
  const whatsapp = whatsappLink(
    trip
      ? `Hi Outway, I have a question about ${trip.title}.`
      : "Hi Outway, I have a question about one of your escapes."
  );

  return (
    <div className="py-14 sm:py-20">
      <Container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          <Reveal>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
              Get in touch
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              {trip ? "Tell us what you need to know" : "Ask us anything"}
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-500">
              Room sharing, dietary needs, whether the monsoon drive is rough, changing an existing
              booking: a real person reads every message and replies within {site.responseTime}.
            </p>

            <dl className="mt-10 space-y-5">
              <ContactRow icon={<Mail size={17} />} label="Email">
                <a href={`mailto:${site.email}`} className="text-ink-700 hover:text-pine">
                  {site.email}
                </a>
              </ContactRow>

              {whatsapp && (
                <ContactRow icon={<MessageCircle size={17} />} label="WhatsApp">
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-700 hover:text-pine"
                  >
                    Message us on WhatsApp
                  </a>
                </ContactRow>
              )}

              {site.phoneDisplay && (
                <ContactRow icon={<Phone size={17} />} label="Phone">
                  <a
                    href={`tel:${site.phoneDisplay.replace(/\s/g, "")}`}
                    className="text-ink-700 hover:text-pine"
                  >
                    {site.phoneDisplay}
                  </a>
                </ContactRow>
              )}

              <ContactRow icon={<MapPin size={17} />} label="Based in">
                <span className="text-ink-700">{site.address || site.city}</span>
              </ContactRow>

              <ContactRow icon={<Clock size={17} />} label="Reply time">
                <span className="text-ink-700">
                  Within {site.responseTime}, Monday to Saturday
                </span>
              </ContactRow>
            </dl>

            <div className="mt-10 rounded-2xl bg-cream-300/70 p-5">
              <p className="text-sm font-semibold text-ink">Already booked?</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                You can view, and if you need to, cancel your booking yourself from{" "}
                <Link href="/account" className="font-medium text-pine underline underline-offset-2">
                  My bookings
                </Link>
                . It shows the exact refund before you confirm anything.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-3xl border border-border bg-white p-6 shadow-card sm:p-8">
              <ContactForm tripId={trip?.id} tripTitle={trip?.title} />
            </div>
          </Reveal>
        </div>
      </Container>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine-50 text-pine">
        {icon}
      </span>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wider text-ink-400">{label}</dt>
        <dd className="mt-0.5 text-sm">{children}</dd>
      </div>
    </div>
  );
}
