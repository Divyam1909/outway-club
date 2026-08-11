"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { TrustBand } from "@/components/trips/trust-band";
import { loadRazorpayScript } from "@/lib/load-razorpay-script";
import { messageFromResponse } from "@/lib/error-messages";
import { formatINR } from "@/lib/utils";
import { site } from "@/config/site";

interface TravelerInput {
  full_name: string;
  age: string;
  gender: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (payload: RazorpayFailure) => void) => void;
    };
  }
}

interface RazorpayFailure {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    step?: string;
    metadata?: { payment_id?: string; order_id?: string };
  };
}

/**
 * Razorpay reports a declined payment through a `payment.failed` event, not by
 * throwing. Its `description` is written for customers ("Your card was
 * declined by the bank"), so it is worth showing — but only after the codes we
 * can phrase better ourselves are handled, and never as a bare empty string.
 */
function paymentFailureMessage(payload: RazorpayFailure): string {
  const { code, description, reason } = payload.error ?? {};

  if (code === "BAD_REQUEST_ERROR" && reason === "payment_cancelled") {
    return "The payment was cancelled before it completed. Nothing has been charged, you can try again.";
  }
  if (reason === "payment_failed" || code === "GATEWAY_ERROR") {
    return (
      description ||
      "Your bank declined the payment. Nothing has been charged, try a different card or UPI app."
    );
  }
  if (code === "NETWORK_ERROR") {
    return "The connection dropped during payment. Check your bank app before retrying. If money left your account, email us instead of paying again.";
  }

  return (
    description ||
    "The payment didn't go through. Nothing has been charged, please try again, or use a different method."
  );
}

export function BookingForm({
  tripId,
  tripTitle,
  departureId,
  pricePerPerson,
  travelersCount,
  prefillName,
  prefillEmail,
}: {
  tripId: string;
  tripTitle: string;
  departureId: string | null;
  pricePerPerson: number;
  travelersCount: number;
  prefillName: string;
  prefillEmail: string;
}) {
  const router = useRouter();
  const [travelers, setTravelers] = useState<TravelerInput[]>(
    Array.from({ length: travelersCount }, (_, i) => ({
      full_name: i === 0 ? prefillName : "",
      age: "",
      gender: "",
    }))
  );
  const [contactPhone, setContactPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /**
   * Validation lives per field, keyed by the same string as the control's id.
   * A single combined role="alert" above the button told a screen-reader user
   * that *something* was wrong and left them to find it in a form that can run
   * to eighteen name boxes; this puts the message under the field it belongs
   * to, marks the field aria-invalid, and moves focus to the first one.
   */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const controls = useRef<Record<string, HTMLElement | null>>({});
  /**
   * Set only when money has left the customer's account but we could not turn
   * it into a booking. It carries the payment id, because that reference is
   * the one thing that lets us reconcile the charge by hand — and this screen
   * may be the only place the customer ever sees it.
   */
  const [paidButUnconfirmed, setPaidButUnconfirmed] = useState<{
    paymentId: string;
    message: string;
  } | null>(null);

  /**
   * The summary can change the party size mid-checkout. Grow or trim the rows
   * to match without discarding names already typed into the ones that stay.
   */
  useEffect(() => {
    setTravelers((prev) => {
      if (prev.length === travelersCount) return prev;
      if (travelersCount < prev.length) return prev.slice(0, travelersCount);
      return [
        ...prev,
        ...Array.from({ length: travelersCount - prev.length }, () => ({
          full_name: "",
          age: "",
          gender: "",
        })),
      ];
    });
  }, [travelersCount]);

  function updateTraveler(index: number, field: keyof TravelerInput, value: string) {
    setTravelers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
    if (field === "full_name") clearFieldError(`traveler-${index}-name`);
  }

  /** Clear as they type, so a corrected field stops shouting immediately. */
  function clearFieldError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  /** Returned in the order the fields appear, so [0] is the one to focus. */
  function validate(): [key: string, message: string][] {
    const found: [string, string][] = [];

    travelers.forEach((traveler, i) => {
      if (!traveler.full_name.trim()) {
        found.push([
          `traveler-${i}-name`,
          "Enter this traveller's name exactly as it appears on their photo ID.",
        ]);
      }
    });

    if (contactPhone.replace(/\D/g, "").length < 10) {
      found.push([
        "contact-phone",
        "Add a phone number your trip captain can reach you on, at least 10 digits.",
      ]);
    }

    if (!acceptedTerms) {
      found.push(["accept-terms", "Please confirm you've read the terms and the refund policy."]);
    }

    return found;
  }

  async function handlePayment() {
    setError(null);

    const problems = validate();
    setFieldErrors(Object.fromEntries(problems));

    if (problems.length > 0) {
      const first = controls.current[problems[0][0]];
      first?.focus();
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setLoading(true);

    try {
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, departureId, numTravelers: travelersCount }),
      });

      if (!orderRes.ok) {
        setError(await messageFromResponse(orderRes, "We couldn't start the payment. Please try again."));
        setLoading(false);
        return;
      }

      const orderData = await orderRes.json().catch(() => null);

      // A 200 that isn't the JSON we expect means something sits between us and
      // the route (a proxy, a cold start). Don't open checkout on a half-known
      // order — that is how people get charged against nothing.
      if (!orderData?.orderId || !orderData?.keyId) {
        setError("We couldn't start the payment properly. Please refresh and try again.");
        setLoading(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setError(
          "We couldn't load the secure checkout. Check your connection (an ad or script blocker can also stop it) then try again."
        );
        setLoading(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: Math.round(orderData.amount * 100),
        currency: "INR",
        name: "Outway Club",
        description: tripTitle,
        order_id: orderData.orderId,
        prefill: { name: prefillName, email: prefillEmail },
        theme: { color: "#1E3D32" },
        // Razorpay invokes this itself, outside the try/catch above. Anything
        // that escapes it is an unhandled rejection: the customer has paid and
        // the screen simply stops responding. Everything in here is therefore
        // wrapped, and every exit either navigates or writes a message.
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              // Only the payment identifiers and the traveller details go up.
              // Trip, departure and headcount are deliberately absent: the
              // server reads those off the Razorpay order so that nothing
              // affecting the price can be edited in the browser.
              body: JSON.stringify({
                ...response,
                travelers: travelers.map((t) => ({
                  full_name: t.full_name,
                  age: t.age ? Number(t.age) : undefined,
                  gender: t.gender || undefined,
                })),
                specialRequests,
                contactPhone,
              }),
            });

            if (!verifyRes.ok) {
              setPaidButUnconfirmed({
                paymentId: response.razorpay_payment_id,
                message: await messageFromResponse(
                  verifyRes,
                  "Your payment went through, but we couldn't confirm the booking automatically."
                ),
              });
              setLoading(false);
              return;
            }

            const verifyData = await verifyRes.json().catch(() => null);

            if (!verifyData?.bookingId) {
              setPaidButUnconfirmed({
                paymentId: response.razorpay_payment_id,
                message:
                  "Your payment went through, but we didn't get a booking reference back from our server.",
              });
              setLoading(false);
              return;
            }

            router.push(`/booking/confirmation/${verifyData.bookingId}`);
          } catch {
            // The payment succeeded and then the connection died. This is the
            // one case where "try again" is the wrong advice — it would charge
            // them twice.
            setPaidButUnconfirmed({
              paymentId: response.razorpay_payment_id,
              message:
                "Your payment went through, but we lost connection before the booking was confirmed.",
            });
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      // A declined card or a failed UPI mandate arrives here, not as a throw.
      // Without this the modal closes and the page looks like nothing happened.
      razorpay.on("payment.failed", (payload: RazorpayFailure) => {
        setError(paymentFailureMessage(payload));
        setLoading(false);
      });

      razorpay.open();
    } catch (caught) {
      console.error("[booking] checkout failed before payment:", caught);
      // Nothing has been charged at this point — the failure happened before
      // or while opening checkout, so retrying is safe to suggest.
      setError(
        "We couldn't open the secure checkout. Nothing has been charged, please try again in a moment."
      );
      setLoading(false);
    }
  }

  // Money has moved but the booking hasn't been recorded. The pay button is
  // deliberately gone: the correct action is to contact us with the payment
  // id, never to pay a second time.
  if (paidButUnconfirmed) {
    return (
      <div className="rounded-2xl border border-clay-100 bg-clay-50/60 p-6 sm:p-8">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clay-100 text-clay-600">
          <AlertTriangle size={24} />
        </span>

        <h2 className="heading-fluid text-xl text-ink sm:text-2xl">
          Your payment went through, the booking needs a manual check
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-ink-700">{paidButUnconfirmed.message}</p>

        <p className="mt-3 text-sm leading-relaxed text-ink-700">
          <strong className="font-semibold">Please don&apos;t pay again.</strong> Send us the
          reference below and we&apos;ll confirm your seat by hand, usually within a few hours. If
          for any reason we can&apos;t, the payment is refunded in full.
        </p>

        <div className="mt-5 rounded-2xl border border-clay-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">Payment ID</p>
          <p className="mt-1 select-all break-all font-mono text-sm font-medium text-ink">
            {paidButUnconfirmed.paymentId}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-ink-500">
            {tripTitle} · {travelersCount} traveller{travelersCount === 1 ? "" : "s"} ·{" "}
            {formatINR(pricePerPerson * travelersCount)}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={`mailto:${site.email}?subject=${encodeURIComponent(
              `Payment ${paidButUnconfirmed.paymentId}: booking not confirmed`
            )}&body=${encodeURIComponent(
              `Hi Outway Club,\n\nMy payment succeeded but the booking wasn't confirmed.\n\nPayment ID: ${paidButUnconfirmed.paymentId}\nTrip: ${tripTitle}\nTravellers: ${travelersCount}\n\nThanks,\n${prefillName || ""}`
            )}`}
            className="btn-primary flex-1"
          >
            Email us this payment ID
          </a>
          <Link href="/account" className="btn-outline flex-1">
            Check my bookings
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-ink-500">
          It&apos;s worth checking your bookings first, sometimes the booking saved and only the
          confirmation screen failed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 heading-sm text-xl text-ink">Traveller details</h2>
        <p className="mb-4 text-sm text-ink-500">
          Names must match the government photo ID each person will carry, hotels record it at
          check-in and we can&apos;t get a room without it.
        </p>
        <div className="space-y-4">
          {travelers.map((traveler, i) => {
            const nameKey = `traveler-${i}-name`;
            const nameError = fieldErrors[nameKey];

            return (
              <div key={i} className="rounded-2xl border border-border p-4">
                <p className="mb-3 text-sm font-semibold text-ink-700">
                  Traveller {i + 1}{" "}
                  {i === 0 && <span className="font-normal text-ink-500">(primary)</span>}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <input
                      id={nameKey}
                      ref={(node) => {
                        controls.current[nameKey] = node;
                      }}
                      aria-label={`Traveller ${i + 1} full name`}
                      aria-invalid={nameError ? true : undefined}
                      aria-describedby={nameError ? `${nameKey}-error` : undefined}
                      placeholder="Full name"
                      value={traveler.full_name}
                      onChange={(e) => updateTraveler(i, "full_name", e.target.value)}
                      className={clsx("field", nameError && "field-error")}
                    />
                    {nameError && (
                      <p id={`${nameKey}-error`} className="field-error-text">
                        <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                        {nameError}
                      </p>
                    )}
                  </div>
                  <input
                    aria-label={`Traveller ${i + 1} age`}
                    placeholder="Age"
                    type="number"
                    min={0}
                    max={120}
                    value={traveler.age}
                    onChange={(e) => updateTraveler(i, "age", e.target.value)}
                    className="field h-fit"
                  />
                  <select
                    aria-label={`Traveller ${i + 1} gender`}
                    value={traveler.gender}
                    onChange={(e) => updateTraveler(i, "gender", e.target.value)}
                    className="field h-fit"
                  >
                    <option value="">Gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="contact-phone" className="field-label">
          Phone number
        </label>
        <input
          id="contact-phone"
          ref={(node) => {
            controls.current["contact-phone"] = node;
          }}
          type="tel"
          autoComplete="tel"
          value={contactPhone}
          onChange={(e) => {
            setContactPhone(e.target.value);
            clearFieldError("contact-phone");
          }}
          placeholder="+91 98765 43210"
          aria-invalid={fieldErrors["contact-phone"] ? true : undefined}
          aria-describedby={
            fieldErrors["contact-phone"] ? "contact-phone-error" : "contact-phone-hint"
          }
          className={clsx("field", fieldErrors["contact-phone"] && "field-error")}
        />
        {fieldErrors["contact-phone"] ? (
          <p id="contact-phone-error" className="field-error-text">
            <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            {fieldErrors["contact-phone"]}
          </p>
        ) : (
          <p id="contact-phone-hint" className="mt-1.5 text-xs text-ink-500">
            Your trip captain uses this on the day, and it&apos;s how we reach you if anything
            changes before departure.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="special-requests" className="field-label">
          Anything we should know? <span className="font-normal text-ink-500">(optional)</span>
        </label>
        <textarea
          id="special-requests"
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          rows={3}
          placeholder="Dietary needs, a medical condition, who you'd like to share a room with, anything at all."
          className="field"
        />
      </div>

      <div>
        <label
          htmlFor="accept-terms"
          className={clsx(
            "flex cursor-pointer items-start gap-3 rounded-2xl p-4",
            fieldErrors["accept-terms"] ? "bg-clay-50 ring-1 ring-clay-600" : "bg-cream-300"
          )}
        >
          <input
            id="accept-terms"
            ref={(node) => {
              controls.current["accept-terms"] = node;
            }}
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => {
              setAcceptedTerms(e.target.checked);
              clearFieldError("accept-terms");
            }}
            aria-invalid={fieldErrors["accept-terms"] ? true : undefined}
            aria-describedby={fieldErrors["accept-terms"] ? "accept-terms-error" : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 accent-pine"
          />
          <span className="text-sm leading-relaxed text-ink-700">
            I&apos;ve read the{" "}
            <Link
              href="/terms"
              target="_blank"
              className="font-medium text-pine underline underline-offset-2"
            >
              Terms of Service
            </Link>{" "}
            and the{" "}
            <Link
              href="/refund-policy"
              target="_blank"
              className="font-medium text-pine underline underline-offset-2"
            >
              cancellation policy
            </Link>
            , and every traveller above will carry original government photo ID.
          </span>
        </label>
        {fieldErrors["accept-terms"] && (
          <p id="accept-terms-error" className="field-error-text">
            <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            {fieldErrors["accept-terms"]}
          </p>
        )}
      </div>

      {/* Payment and network failures, not field validation — those live under
          the field they belong to and move focus there instead. */}
      {error && (
        <p role="alert" className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <button onClick={handlePayment} disabled={loading} className="btn-accent btn-lg w-full">
        {loading ? "Opening secure checkout…" : `Pay ${formatINR(pricePerPerson * travelersCount)}`}
      </button>

      <TrustBand />
    </div>
  );
}
