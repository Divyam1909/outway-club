"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, User as UserIcon, ChevronDown, Settings, Ticket, LogOut } from "lucide-react";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/use-session";

export function NavbarClient({ links }: { links: { href: string; label: string }[] }) {
  const { loading, isSignedIn, isAdmin, fullName } = useSession();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close the drawer on navigation, and lock body scroll while it's open.
  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setAccountOpen(false);
      }
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    function onClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [accountOpen]);

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
      {/* 64px on mobile, not 80px: a sticky bar is a permanent tax on the
          viewport, and 16px of it was buying nothing on a 640px-tall phone. */}
      <div className="container-outway flex h-16 items-center justify-between gap-4 py-2 lg:h-20 lg:py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Outway Club, home">
          <Image
            src="/brand/logo.png"
            alt="Outway Club"
            width={56}
            height={56}
            priority
            className="h-10 w-10 rounded-full sm:h-12 sm:w-12 lg:h-14 lg:w-14"
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
          {/* Auth resolves in the browser now, so this slot is briefly unknown.
              Holding its width keeps the bar from reflowing under the cursor
              at the exact moment someone is reaching for "Log in". */}
          {loading && <span aria-hidden="true" className="h-10 w-[12.5rem]" />}
          {!loading && isAdmin && (
            <Link href="/admin" className="text-sm font-medium text-ink-700 hover:text-pine">
              Admin
            </Link>
          )}
          {loading ? null : isSignedIn ? (
            <>
              <Link href="/account" className="text-sm font-medium text-ink-700 hover:text-pine">
                My Bookings
              </Link>
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((value) => !value)}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  className="btn-ghost px-3"
                >
                  <UserIcon size={16} />
                  {fullName ? fullName.split(" ")[0] : "Account"}
                  <ChevronDown size={14} className={clsx("transition-transform", accountOpen && "rotate-180")} />
                </button>

                {accountOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+0.5rem)] w-52 overflow-hidden rounded-2xl border border-border bg-white py-1.5 shadow-lifted animate-fade-in"
                  >
                    <Link
                      href="/account"
                      role="menuitem"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-cream-300"
                    >
                      <Ticket size={15} className="text-clay" /> My Bookings
                    </Link>
                    <Link
                      href="/account/settings"
                      role="menuitem"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-cream-300"
                    >
                      <Settings size={15} className="text-clay" /> Settings
                    </Link>
                    <div className="my-1.5 border-t border-border" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-cream-300 disabled:opacity-60"
                    >
                      <LogOut size={15} className="text-clay" />
                      {signingOut ? "Signing out…" : "Sign out"}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/trips" className="btn-primary">
                Book a trip
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
        <nav aria-label="Mobile" className="container-outway flex max-h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto py-4">
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
            {!loading && isAdmin && (
              <Link href="/admin" className="btn-outline">
                Admin dashboard
              </Link>
            )}
            {loading ? null : isSignedIn ? (
              <>
                <Link href="/account" className="btn-outline">
                  My Bookings
                </Link>
                <Link href="/account/settings" className="btn-outline">
                  Settings
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
                <Link href="/trips" className="btn-primary">
                  Book a trip
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
