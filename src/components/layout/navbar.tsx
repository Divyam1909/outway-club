import { NavbarClient } from "./navbar-client";

export const NAV_LINKS = [
  { href: "/trips", label: "Escapes" },
  { href: "/destinations", label: "Destinations" },
  { href: "/blog", label: "Journal" },
  { href: "/testimonials", label: "Reviews" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

/**
 * Deliberately does no auth work.
 *
 * This used to `await getCurrentUser()`, which reads cookies — and since the
 * navbar sits in the root layout, that single call made every route in the app
 * dynamic and uncacheable, ISR exports included. The account area now resolves
 * its own state in the browser via `useSession`.
 */
export function Navbar() {
  return <NavbarClient links={NAV_LINKS} />;
}
