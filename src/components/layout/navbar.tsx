import { getCurrentUser } from "@/lib/auth";
import { NavbarClient } from "./navbar-client";

export const NAV_LINKS = [
  { href: "/trips", label: "Escapes" },
  { href: "/blog", label: "Journal" },
  { href: "/testimonials", label: "Reviews" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

export async function Navbar() {
  const currentUser = await getCurrentUser();

  return (
    <NavbarClient
      links={NAV_LINKS}
      fullName={currentUser?.profile?.full_name ?? null}
      isAdmin={currentUser?.profile?.role === "admin"}
      isSignedIn={Boolean(currentUser)}
    />
  );
}
