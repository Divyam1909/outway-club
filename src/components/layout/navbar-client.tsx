"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-cream-100/90 backdrop-blur">
      <div className="container-outway flex h-20 items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Outway Club" className="h-14 w-14 rounded-full" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-700 transition-colors hover:text-pine"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAdmin && (
            <Link href="/admin" className="text-sm font-medium text-ink-700 hover:text-pine">
              Admin
            </Link>
          )}
          {isSignedIn ? (
            <>
              <Link href="/account" className="btn-ghost">
                <UserIcon size={16} />
                {fullName ? fullName.split(" ")[0] : "My account"}
              </Link>
              <button onClick={handleSignOut} className="btn-outline">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/trips" className="btn-accent">
                Plan a trip
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        className={clsx(
          "overflow-hidden border-t border-border/70 bg-cream-100 md:hidden",
          open ? "max-h-[28rem]" : "max-h-0 border-t-0"
        )}
      >
        <div className="container-outway flex flex-col gap-1 py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-2 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink/5"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-border/70 pt-3">
            {isAdmin && (
              <Link href="/admin" className="btn-outline" onClick={() => setOpen(false)}>
                Admin dashboard
              </Link>
            )}
            {isSignedIn ? (
              <>
                <Link href="/account" className="btn-outline" onClick={() => setOpen(false)}>
                  My account
                </Link>
                <button onClick={handleSignOut} className="btn-primary">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-outline" onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Link href="/trips" className="btn-accent" onClick={() => setOpen(false)}>
                  Plan a trip
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
