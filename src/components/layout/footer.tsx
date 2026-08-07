import Image from "next/image";
import Link from "next/link";
import { Instagram, Mail, MapPin, MessageCircle, Youtube } from "lucide-react";
import { Container } from "@/components/ui/container";
import { NewsletterForm } from "@/components/newsletter-form";
import { site, whatsappLink } from "@/config/site";

const COLUMNS = [
  {
    title: "Travel",
    links: [
      { href: "/trips", label: "All escapes" },
      { href: "/trips#notify", label: "Notify me" },
      { href: "/testimonials", label: "Traveller reviews" },
    ],
  },
  {
    title: "Outway",
    links: [
      { href: "/blog", label: "The Journal" },
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQs" },
      { href: "/account", label: "My Bookings" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/refund-policy", label: "Cancellation & refunds" },
    ],
  },
];

export function Footer() {
  const whatsapp = whatsappLink("Hi Outway, I have a question.");

  return (
    <footer className="border-t border-border bg-pine-700 text-cream-100">
      <Container className="py-14 sm:py-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-[1.5fr_1fr_1fr_1fr] lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.4fr]">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="Outway Club, home">
              <Image
                src="/brand/logo.png"
                alt="Outway Club"
                width={48}
                height={48}
                className="h-12 w-12 rounded-full"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-100/70">
              Small-group escapes across India, each one planned end to end and capped tight
              enough that you&apos;ll know everyone&apos;s name by the second evening.
            </p>

            <div className="mt-5 flex gap-3">
              {site.social.instagram && (
                <a
                  href={site.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Outway Club on Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-100/10 text-cream-100/75 transition-colors hover:bg-gold hover:text-pine-700"
                >
                  <Instagram size={17} />
                </a>
              )}
              {site.social.youtube && (
                <a
                  href={site.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Outway Club on YouTube"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-100/10 text-cream-100/75 transition-colors hover:bg-gold hover:text-pine-700"
                >
                  <Youtube size={17} />
                </a>
              )}
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Message Outway Club on WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-100/10 text-cream-100/75 transition-colors hover:bg-gold hover:text-pine-700"
                >
                  <MessageCircle size={17} />
                </a>
              )}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-cream-100/45">
                {column.title}
              </p>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream-100/80 transition-colors hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-cream-100/45">
              Hear about Escape 002 first
            </p>
            <NewsletterForm source="footer" />
            <p className="mt-3 text-xs leading-relaxed text-cream-100/50">
              One email when a new escape opens. Nothing else, ever.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-cream-100/10 pt-7 text-xs text-cream-100/55 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href={`mailto:${site.email}`} className="flex items-center gap-1.5 hover:text-gold">
              <Mail size={13} /> {site.email}
            </a>
            {site.phoneDisplay && (
              <a href={`tel:${site.phoneDisplay.replace(/\s/g, "")}`} className="hover:text-gold">
                {site.phoneDisplay}
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <MapPin size={13} /> {site.address || site.city}
            </span>
          </div>
          <p>
            &copy; {new Date().getFullYear()} {site.legalName}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
