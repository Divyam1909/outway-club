"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [specialRequests, setSpecialRequests] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateTraveler(index: number, field: keyof TravelerInput, value: string) {
    setTravelers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  async function handlePayment() {
    setError(null);

    if (travelers.some((t) => !t.full_name.trim())) {
      setError("Please enter a name for every traveler.");
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
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">Traveler details</h2>
        <div className="space-y-4">
          {travelers.map((traveler, i) => (
            <div key={i} className="rounded-2xl border border-border p-4">
              <p className="mb-3 text-sm font-semibold text-ink-700">
                Traveler {i + 1} {i === 0 && <span className="text-ink-400">(primary)</span>}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  placeholder="Full name"
                  value={traveler.full_name}
                  onChange={(e) => updateTraveler(i, "full_name", e.target.value)}
                  className="rounded-xl border border-border px-3 py-2 text-sm focus:border-pine focus:outline-none sm:col-span-1"
                />
                <input
                  placeholder="Age"
                  type="number"
                  min={0}
                  value={traveler.age}
                  onChange={(e) => updateTraveler(i, "age", e.target.value)}
                  className="rounded-xl border border-border px-3 py-2 text-sm focus:border-pine focus:outline-none"
                />
                <select
                  value={traveler.gender}
                  onChange={(e) => updateTraveler(i, "gender", e.target.value)}
                  className="rounded-xl border border-border px-3 py-2 text-sm focus:border-pine focus:outline-none"
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
        <label className="mb-1.5 block text-sm font-medium text-ink-700">
          Special requests <span className="text-ink-400">(optional)</span>
        </label>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          rows={3}
          placeholder="Dietary restrictions, room preferences, anything we should know…"
          className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-pine focus:outline-none"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">{error}</p>
      )}

      <button onClick={handlePayment} disabled={loading} className="btn-accent w-full py-3.5 text-base">
        {loading ? "Opening secure checkout…" : `Pay ${formatINR(pricePerPerson * travelersCount)}`}
      </button>
      <p className="text-center text-xs text-ink-400">
        You&apos;ll be redirected to Razorpay&apos;s secure checkout. Booking for{" "}
        <span className="font-medium text-ink-500">{tripTitle}</span>.
      </p>
    </div>
  );
}
