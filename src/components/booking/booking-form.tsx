"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { loadRazorpayScript } from "@/lib/load-razorpay-script";
import { formatINR } from "@/lib/utils";

interface TravelerInput {
  full_name: string;
  age: string;
  gender: string;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
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

  function updateTraveler(index: number, field: keyof TravelerInput, value: string) {
    setTravelers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  async function handlePayment() {
    setError(null);

    if (travelers.some((t) => !t.full_name.trim())) {
      setError("Please enter a name for every traveller, exactly as it appears on their ID.");
      return;
    }
    if (contactPhone.replace(/\D/g, "").length < 10) {
      setError("Please add a phone number your trip captain can reach you on.");
      return;
    }
    if (!acceptedTerms) {
      setError("Please confirm you've read the terms and the cancellation policy.");
      return;
    }

    setLoading(true);

    try {
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, departureId, numTravelers: travelersCount }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        setError(orderData.error ?? "Could not start payment.");
        setLoading(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Could not load payment gateway. Check your connection and try again.");
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
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              tripId,
              departureId,
              numTravelers: travelersCount,
              travelers: travelers.map((t) => ({
                full_name: t.full_name,
                age: t.age ? Number(t.age) : undefined,
                gender: t.gender || undefined,
              })),
              specialRequests,
              contactPhone,
            }),
          });
          const verifyData = await verifyRes.json();

          if (!verifyRes.ok) {
            setError(verifyData.error ?? "Payment could not be verified. Contact support.");
            setLoading(false);
            return;
          }

          router.push(`/booking/confirmation/${verifyData.bookingId}`);
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      razorpay.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 font-display text-xl font-semibold text-ink">Traveller details</h2>
        <p className="mb-4 text-sm text-ink-500">
          Names must match the government photo ID each person will carry — hotels record it at
          check-in and we can&apos;t get a room without it.
        </p>
        <div className="space-y-4">
          {travelers.map((traveler, i) => (
            <div key={i} className="rounded-2xl border border-border p-4">
              <p className="mb-3 text-sm font-semibold text-ink-700">
                Traveller {i + 1} {i === 0 && <span className="font-normal text-ink-400">(primary)</span>}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  aria-label={`Traveller ${i + 1} full name`}
                  placeholder="Full name"
                  value={traveler.full_name}
                  onChange={(e) => updateTraveler(i, "full_name", e.target.value)}
                  className="field sm:col-span-1"
                />
                <input
                  aria-label={`Traveller ${i + 1} age`}
                  placeholder="Age"
                  type="number"
                  min={0}
                  max={120}
                  value={traveler.age}
                  onChange={(e) => updateTraveler(i, "age", e.target.value)}
                  className="field"
                />
                <select
                  aria-label={`Traveller ${i + 1} gender`}
                  value={traveler.gender}
                  onChange={(e) => updateTraveler(i, "gender", e.target.value)}
                  className="field"
                >
                  <option value="">Gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="contact-phone" className="field-label">
          Phone number
        </label>
        <input
          id="contact-phone"
          type="tel"
          autoComplete="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="field"
        />
        <p className="mt-1.5 text-xs text-ink-400">
          Your trip captain uses this on the day — and it&apos;s how we reach you if anything
          changes before departure.
        </p>
      </div>

      <div>
        <label htmlFor="special-requests" className="field-label">
          Anything we should know? <span className="font-normal text-ink-400">(optional)</span>
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

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-cream-300/60 p-4">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-pine"
        />
        <span className="text-sm leading-relaxed text-ink-700">
          I&apos;ve read the{" "}
          <Link href="/terms" target="_blank" className="font-medium text-pine underline underline-offset-2">
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

      {error && (
        <p role="alert" className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <button onClick={handlePayment} disabled={loading} className="btn-accent w-full py-4 text-base">
        {loading ? "Opening secure checkout…" : `Pay ${formatINR(pricePerPerson * travelersCount)}`}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-400">
        <ShieldCheck size={13} className="text-pine" />
        Secure checkout by Razorpay · UPI, cards and netbanking · we never see your card details
      </p>
    </div>
  );
}
