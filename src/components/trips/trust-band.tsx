import Link from "next/link";
import { CreditCard, Landmark, Lock, Smartphone } from "lucide-react";
import { REFUND_TIERS } from "@/config/site";

/**
 * The three things a stranger wants to know at the moment they are about to
 * pay: who takes the money, what happens if they change their mind, and
 * whether the number they were quoted is the number they'll be charged.
 *
 * The refund figures are read from REFUND_TIERS, which is the same array the
 * cancellation API computes against — this band and the money can't drift.
 * No badge here claims anything we can't evidence: the payment marks name
 * methods Razorpay actually accepts, and nothing else.
 */

const METHODS = [
  { icon: Smartphone, label: "UPI" },
  { icon: CreditCard, label: "Cards" },
  { icon: Landmark, label: "Netbanking" },
];

/** Higher refund = more reassuring, so the tone tracks the percentage. */
function tierTone(percent: number): string {
  if (percent >= 75) return "bg-pine-50 text-pine-600";
  if (percent > 0) return "bg-gold-100 text-gold-600";
  return "bg-ink/5 text-ink-500";
}

export function TrustBand({
  /** `compact` drops the refund ladder — for the sidebar, where space is tight. */
  variant = "full",
  className,
}: {
  variant?: "full" | "compact";
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-700">
          <Lock size={13} className="text-pine" aria-hidden="true" />
          Secured by Razorpay
        </span>
        <ul className="flex flex-wrap items-center gap-2">
          {METHODS.map((method) => (
            <li
              key={method.label}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700"
            >
              <method.icon size={13} className="text-ink-500" aria-hidden="true" />
              {method.label}
            </li>
          ))}
        </ul>
      </div>

      {variant === "full" && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-1.5" role="group" aria-label="Refund ladder">
            {REFUND_TIERS.map((tier) => (
              <div
                key={tier.minDaysBefore}
                className={`rounded-xl px-3 py-2.5 text-center ${tierTone(tier.refundPercent)}`}
              >
                <p className="text-lg font-semibold leading-none">{tier.refundPercent}%</p>
                <p className="mt-1.5 text-[11px] font-medium leading-tight">
                  {tier.label.replace(" before departure", "")}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-ink-500">
            Back to you if you cancel, by how far out you are. If <em>we</em> cancel, it&apos;s
            100%, no exceptions.{" "}
            <Link
              href="/refund-policy"
              className="font-medium text-pine underline underline-offset-2"
            >
              Full policy
            </Link>
            .
          </p>
        </>
      )}

      <p className="mt-3 text-xs leading-relaxed text-ink-500">
        The total above is the total. No convenience fee, no card surcharge, and we never see your
        card details.
      </p>
    </div>
  );
}
