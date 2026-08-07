"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { messageFromResponse } from "@/lib/error-messages";
import { formatINR } from "@/lib/utils";

/**
 * Cancellation with the refund figure shown *before* the customer commits.
 * The percentage is computed on the server from the shared REFUND_TIERS
 * constant and passed in, so this dialog can never quote a number the API
 * won't honour.
 */
export function CancelBookingButton({
  bookingId,
  tripTitle,
  totalAmount,
  refundPercent,
  daysBeforeDeparture,
}: {
  bookingId: string;
  tripTitle: string;
  totalAmount: number;
  refundPercent: number;
  daysBeforeDeparture: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refundAmount = Math.round((totalAmount * refundPercent) / 100);

  async function handleCancel() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        setError(
          await messageFromResponse(
            response,
            "We couldn't cancel that just now. Nothing has changed, please try again, or email us."
          )
        );
        setLoading(false);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      // The request may or may not have reached the server. Say so honestly —
      // "try again" alone risks a second cancellation being attempted on a
      // booking that was already cancelled.
      setError(
        "We couldn't reach the server, so we can't confirm whether the cancellation went through. Refresh this page to check before trying again."
      );
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-ink-400 underline underline-offset-2 transition-colors hover:text-clay"
      >
        Cancel booking
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`cancel-title-${bookingId}`}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={(event) => {
            if (event.target === event.currentTarget && !loading) setOpen(false);
          }}
        >
          <div className="animate-fade-up w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-lifted">
            <div className="flex items-start justify-between gap-4 border-b border-border p-6">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay-50 text-clay">
                  <AlertTriangle size={20} />
                </span>
                <div>
                  <h2 id={`cancel-title-${bookingId}`} className="font-display text-lg font-semibold text-ink">
                    Cancel this booking?
                  </h2>
                  <p className="mt-1 text-sm text-ink-500">{tripTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                aria-label="Close"
                className="rounded-full p-1 text-ink-400 hover:bg-ink/5 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-2xl bg-cream-300/70 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-500">You paid</span>
                  <span className="font-medium text-ink-700">{formatINR(totalAmount)}</span>
                </div>
                {daysBeforeDeparture !== null && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-ink-500">Days before departure</span>
                    <span className="font-medium text-ink-700">
                      {daysBeforeDeparture > 0 ? daysBeforeDeparture : 0}
                    </span>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm font-semibold text-ink">Refund due ({refundPercent}%)</span>
                  <span
                    className={
                      refundAmount > 0
                        ? "font-display text-xl font-semibold text-pine"
                        : "font-display text-xl font-semibold text-ink-400"
                    }
                  >
                    {formatINR(refundAmount)}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-ink-400">
                {refundAmount > 0
                  ? "We initiate the refund to your original payment method within 2 working days. Your bank then takes 5 to 7 working days to post it."
                  : "This cancellation falls inside the no-refund window in our cancellation policy. If there are exceptional circumstances, email us instead of cancelling here."}
              </p>

              <label htmlFor={`reason-${bookingId}`} className="field-label mt-5">
                Anything you want to tell us? <span className="font-normal text-ink-400">(optional)</span>
              </label>
              <textarea
                id={`reason-${bookingId}`}
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="field"
                placeholder="It genuinely helps us understand what went wrong."
              />

              {error && (
                <p role="alert" className="mt-3 rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
                  {error}
                </p>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="btn-outline flex-1"
                >
                  Keep my booking
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="btn flex-1 bg-clay text-cream-100 hover:bg-clay-600"
                >
                  {loading ? "Cancelling…" : "Confirm cancellation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
