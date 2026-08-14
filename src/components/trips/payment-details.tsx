import { clsx } from "clsx";
import { AlertTriangle, IndianRupee, MessageCircle, Smartphone } from "lucide-react";
import { CopyValue } from "@/components/ui/copy-value";
import { site, hasPaymentDetails, whatsappLink } from "@/config/site";

/**
 * How you actually pay, published on the page.
 *
 * There is no online checkout while `paymentsEnabled` is false, so this is the
 * whole payment mechanism: UPI or a bank transfer, then a screenshot on
 * WhatsApp. Putting the account on the page before anyone has committed is
 * the norm for operators this size, and it answers the real question a reader
 * has — "how does this work, and who am I paying?" — instead of leaving it
 * until after they've filled a form.
 *
 * Renders nothing at all until the details are configured. A payment section
 * with a blank account number is worse than no payment section.
 */
export function PaymentDetails({
  tripTitle,
  className,
}: {
  tripTitle?: string;
  className?: string;
}) {
  if (!hasPaymentDetails()) return null;

  const { upiId, accountName, bankName, accountNumber, ifsc } = site.bank;
  const hasBank = Boolean(accountName && bankName && accountNumber && ifsc);
  const whatsapp = whatsappLink(
    tripTitle
      ? `Hi Outway, I've paid for ${tripTitle}. Here's the screenshot.`
      : "Hi Outway, here's my payment screenshot."
  );

  return (
    <section className={clsx("rounded-2xl border border-border bg-white p-6", className)}>
      <h2 className="heading-sm flex items-center gap-2 text-lg text-ink">
        <IndianRupee size={18} className="text-pine" aria-hidden="true" /> Payment details
      </h2>

      <p className="mt-2.5 text-sm leading-relaxed text-ink-500">
        Nothing is charged on this website. You send the booking request first, we confirm the seat
        is genuinely free and tell you the exact amount, and only then do you pay — by UPI or a
        bank transfer, to the account below.
      </p>

      {upiId && (
        <div className="mt-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Smartphone size={15} className="text-pine" aria-hidden="true" /> UPI
          </p>
          <div className="mt-1.5 rounded-xl bg-cream-300 px-4 py-1">
            <CopyValue label="UPI ID" value={upiId} />
          </div>
        </div>
      )}

      {hasBank && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-ink">Bank transfer / NEFT</p>
          <div className="mt-1.5 rounded-xl bg-cream-300 px-4 py-1">
            <CopyValue label="Account name" value={accountName} />
            <CopyValue label="Bank" value={bankName} />
            <CopyValue label="Account number" value={accountNumber} />
            <CopyValue label="IFSC" value={ifsc} />
          </div>
        </div>
      )}

      <p className="mt-5 text-sm leading-relaxed text-ink-700">
        <strong className="font-semibold text-ink">Once you&apos;ve paid</strong>, send us the
        screenshot{" "}
        {whatsapp ? (
          <>
            on{" "}
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-pine underline underline-offset-2"
            >
              <MessageCircle size={14} aria-hidden="true" />
              WhatsApp
              {site.phoneDisplay ? ` (${site.phoneDisplay})` : ""}
            </a>
          </>
        ) : (
          <>
            at{" "}
            <a
              href={`mailto:${site.email}`}
              className="font-medium text-pine underline underline-offset-2"
            >
              {site.email}
            </a>
          </>
        )}{" "}
        and we&apos;ll confirm your seat and send the joining details. Your booking is confirmed
        when we say it is, in writing — not when the transfer leaves your account.
      </p>

      {/* The one line on this page that protects someone's money. UPI
          impersonation of small travel operators is common enough that naming
          the risk is worth more than another reassurance. */}
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-clay-50 px-4 py-3 text-xs leading-relaxed text-clay-600">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          These are the only accounts we ever collect money into. We will never ask you to pay a
          different UPI ID, a personal account, or anyone claiming to be an agent. If you see
          anything else, stop and call us first.
        </span>
      </p>
    </section>
  );
}
