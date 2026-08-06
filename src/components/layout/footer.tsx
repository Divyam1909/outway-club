import Link from "next/link";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { Container } from "@/components/ui/container";
import { NewsletterForm } from "@/components/newsletter-form";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/trips", label: "All trips" },
      { href: "/destinations", label: "Destinations" },
      { href: "/group-trips", label: "Group trips" },
      { href: "/trips?category=honeymoon", label: "Honeymoon trips" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQs" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/signup", label: "Create account" },
      { href: "/account", label: "My bookings" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-pine-700 text-cream-100">
      <Container className="py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Outway Club" className="h-12 w-12 rounded-full" />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-cream-100/70">
              Small-group and private trips across India, planned properly — full itineraries,
              honest pricing, real trip leaders on the ground.
            </p>
            <div className="mt-5 flex gap-4">
              <a href="#" aria-label="Instagram" className="text-cream-100/70 hover:text-gold">
                <Instagram size={18} />
              </a>
              <a href="#" aria-label="Facebook" className="text-cream-100/70 hover:text-gold">
                <Facebook size={18} />
              </a>
              <a href="#" aria-label="YouTube" className="text-cream-100/70 hover:text-gold">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-cream-100/50">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-cream-100/80 hover:text-gold">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-cream-100/50">
              Trip ideas in your inbox
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-cream-100/10 pt-6 text-xs text-cream-100/50 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Outway Club. All rights reserved.</p>
          <p>Made for people who&apos;d rather be somewhere else this weekend.</p>
        </div>
      </Container>
    </footer>
  );
}
