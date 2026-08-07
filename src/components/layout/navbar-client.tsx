"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, User as UserIcon } from "lucide-react";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";

export function NavbarClient({
  links,
  fullName,
  isAdmin,
  isSignedIn,
}: {
  links: { href: string; label: string }[];
  fullName: string | null;
  isAdmin: boolean;
  isSignedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Close the drawer on navigation, and lock body scroll while it's open.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
    router.push("/");
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-cream-100/90 backdrop-blur-md">
      <div className="container-outway flex h-20 items-center justify-between gap-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Outway Club — home">
          <Image
            src="/brand/logo.png"
            alt="Outway Club"
            width={56}
            height={56}
            priority
            className="h-12 w-12 rounded-full sm:h-14 sm:w-14"
          />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={clsx(
                "relative text-sm font-medium transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-clay after:transition-all",
                isActive(link.href)
                  ? "text-pine after:w-full"
                  : "text-ink-700 after:w-0 hover:text-pine hover:after:w-full"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAdmin && (
            <Link href="/admin" className="text-sm font-medium text-ink-700 hover:text-pine">
              Admin
            </Link>
          )}
          {isSignedIn ? (
            <>
              <Link href="/account" className="btn-ghost !px-3">
                <UserIcon size={16} />
                {fullName ? fullName.split(" ")[0] : "Account"}
              </Link>
              <button onClick={handleSignOut} disabled={signingOut} className="btn-outline">
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/trips" className="btn-accent">
                Book Escape 001
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-border/70 bg-cream-100 lg:hidden"
      >
        <nav aria-label="Mobile" className="container-outway flex max-h-[calc(100vh-5rem)] flex-col gap-1 overflow-y-auto py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={clsx(
                "rounded-xl px-3 py-3 text-base font-medium transition-colors",
                isActive(link.href) ? "bg-pine-50 text-pine" : "text-ink-700 hover:bg-ink/5"
              )}
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-3 flex flex-col gap-2 border-t border-border/70 pt-4">
            {isAdmin && (
              <Link href="/admin" className="btn-outline">
                Admin dashboard
              </Link>
            )}
            {isSignedIn ? (
              <>
                <Link href="/account" className="btn-outline">
                  My bookings
                </Link>
                <button onClick={handleSignOut} disabled={signingOut} className="btn-primary">
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-outline">
                  Log in
                </Link>
                <Link href="/trips" className="btn-accent">
                  Book Escape 001
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
