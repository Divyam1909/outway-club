"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Lock,
  PenLine,
  Star,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ReviewForm } from "@/components/reviews/review-form";
import { messageFromResponse, networkError } from "@/lib/error-messages";

/**
 * "Write a review" for the public reviews page.
 *
 * The review API only accepts a submission from an account with a paid booking
 * on a departure that has already ended, and that rule isn't relaxed here —
 * this just moves the discovery problem. Before, the only way in was a link
 * emailed after a trip; now anyone can press the button and be told, in the
 * dialog, exactly which of their trips they can review and why the others are
 * locked. Eligibility is still decided server-side on POST.
 */

type EligibleTrip = {
  id: string;
  title: string;
  slug: string;
  state: "open" | "upcoming" | "reviewed";
  endDate: string | null;
};

type Eligibility = {
  signedIn: boolean;
  defaultAuthorName: string;
  trips: EligibleTrip[];
};

export function WriteReviewCta({ className }: { className?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Eligibility | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setData(null);
    try {
      const response = await fetch("/api/reviews/eligible", { cache: "no-store" });
      if (!response.ok) {
        setLoadError(await messageFromResponse(response, "Couldn't check your bookings."));
        return;
      }
      const payload = (await response.json()) as Eligibility;
      setData(payload);
      // One eligible trip is the common case — skip the picker entirely.
      const openTrips = payload.trips.filter((trip) => trip.state === "open");
      setSelectedId(openTrips.length === 1 ? openTrips[0].id : null);
    } catch {
      setLoadError(networkError());
    }
  }, []);

  function openDialog() {
    setSubmitted(false);
    setSelectedId(null);
    setOpen(true);
    void load();
  }

  const openTrips = data?.trips.filter((trip) => trip.state === "open") ?? [];
  const lockedTrips = data?.trips.filter((trip) => trip.state !== "open") ?? [];
  const selected = openTrips.find((trip) => trip.id === selectedId) ?? null;

  return (
    <>
      <button type="button" onClick={openDialog} className={className ?? "btn-primary btn-lg"}>
        <PenLine size={16} /> Write a review
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={submitted ? "Thank you, genuinely." : selected ? selected.title : "Write a review"}
        description={
          submitted
            ? undefined
            : selected
              ? "Be honest. A critical review is more useful to us than a polite one."
              : "Reviews here only ever come from people who actually travelled with us."
        }
      >
        {submitted ? (
          <div className="py-2 text-center">
            <CheckCircle2 className="mx-auto mb-4 text-pine" size={34} />
            <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-500">
              Your review is with us. We read every one before it goes live, which usually takes a
              day, and we publish it exactly as you wrote it. We never edit a review to be kinder.
            </p>
            <button type="button" onClick={() => setOpen(false)} className="btn-outline mt-7">
              Close
            </button>
          </div>
        ) : loadError ? (
          <Notice
            icon={<Lock size={22} className="text-clay" />}
            title="We couldn't check your bookings"
            body={loadError}
          >
            <button type="button" onClick={() => void load()} className="btn-outline mt-6">
              Try again
            </button>
          </Notice>
        ) : !data ? (
          <div className="space-y-3 py-2" aria-busy="true">
            <div className="h-4 w-2/3 animate-pulse rounded bg-cream-300" />
            <div className="h-4 w-full animate-pulse rounded bg-cream-300" />
            <div className="h-20 w-full animate-pulse rounded-2xl bg-cream-300" />
            <span className="sr-only">Checking your bookings…</span>
          </div>
        ) : !data.signedIn ? (
          <Notice
            icon={<Lock size={22} className="text-pine" />}
            title="Sign in with the account you booked on"
            body="We match reviews to a real, paid booking. That's the only way we can promise every review on this page came from someone who actually went."
          >
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={`/login?redirect=${encodeURIComponent(pathname)}`}
                className="btn-primary"
              >
                Sign in
              </Link>
              <Link href="/signup" className="btn-outline">
                Create an account
              </Link>
            </div>
          </Notice>
        ) : selected ? (
          <div>
            {openTrips.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="mb-5 text-sm font-semibold text-clay hover:underline"
              >
                ← Choose a different trip
              </button>
            )}
            <ReviewForm
              tripId={selected.id}
              tripTitle={selected.title}
              defaultAuthorName={data.defaultAuthorName}
              onSubmitted={() => setSubmitted(true)}
            />
          </div>
        ) : openTrips.length > 0 ? (
          <div>
            <p className="mb-4 text-sm text-ink-500">
              You&apos;ve travelled on {openTrips.length} of our escapes. Which one are you writing
              about?
            </p>
            <ul className="space-y-2.5">
              {openTrips.map((trip) => (
                <li key={trip.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(trip.id)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-white px-5 py-4 text-left transition-colors hover:border-pine hover:bg-pine-50/50"
                  >
                    <span>
                      <span className="block font-semibold text-ink">{trip.title}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
                        <Star size={12} className="text-gold" /> Ready to review
                      </span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-ink-500" />
                  </button>
                </li>
              ))}
            </ul>
            <LockedList trips={lockedTrips} />
          </div>
        ) : (
          <Notice
            icon={
              lockedTrips.some((trip) => trip.state === "upcoming") ? (
                <CalendarClock size={22} className="text-clay" />
              ) : (
                <Lock size={22} className="text-ink-500" />
              )
            }
            title={
              lockedTrips.some((trip) => trip.state === "upcoming")
                ? "Not quite yet"
                : lockedTrips.length > 0
                  ? "You've reviewed everything you've been on"
                  : "Reviews are for travellers only"
            }
            body={
              lockedTrips.some((trip) => trip.state === "upcoming")
                ? "Your trip hasn't run yet. This unlocks the day after you get back, and we'll email you a link then."
                : lockedTrips.length > 0
                  ? "Thank you. If you'd like to change or remove a review you've already left, email us and we'll do it the same day."
                  : "We couldn't find a completed booking on your account. That's deliberate — it's the only way we can promise every review here is real. If you did travel with us and this looks wrong, email us and we'll fix it."
            }
          >
            <LockedList trips={lockedTrips} />
            {lockedTrips.length === 0 && (
              <Link href="/trips" className="btn-primary mt-6">
                See what&apos;s open now
              </Link>
            )}
          </Notice>
        )}
      </Modal>
    </>
  );
}

function LockedList({ trips }: { trips: EligibleTrip[] }) {
  if (trips.length === 0) return null;

  return (
    <ul className="mt-5 space-y-2 border-t border-border pt-5 text-left">
      {trips.map((trip) => (
        <li
          key={trip.id}
          className="flex items-center justify-between gap-3 rounded-xl bg-cream-300 px-4 py-3 text-sm"
        >
          <span className="font-medium text-ink-700">{trip.title}</span>
          <span className="shrink-0 text-xs text-ink-500">
            {trip.state === "reviewed" ? "Already reviewed" : "Not back yet"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Notice({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="py-2 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-300">
        {icon}
      </div>
      <h3 className="heading-sm text-lg text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">{body}</p>
      {children}
    </div>
  );
}
