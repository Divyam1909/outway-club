import { clsx } from "clsx";
import { AlertTriangle, Camera, IndianRupee, MessageCircle, Smartphone } from "lucide-react";
import { CopyValue } from "@/components/ui/copy-value";
import { formatINR } from "@/lib/utils";
import { site, hasPaymentDetails, whatsappLink } from "@/config/site";

/**
 * How you actually pay, published on the page.
 *
 * There is no online checkout while `paymentsEnabled` is false, so this is the
 * whole payment mechanism: UPI or a bank transfer, then a screenshot on
 * WhatsApp. Putting the account on the page before anyone has committed is the
 * norm for operators this size, and it answers the real question a reader has —
 * "how does this work, and who am I paying?" — instead of leaving it until
 * after they've filled a form.
 *
 * Two modes, and the difference matters:
 *
 *   - Before a request is sent, this is *information*. No amount, because there
 *     isn't one yet — a seat has to be confirmed free before anyone should be
 *     transferring money.
 *   - After it's sent (`amount` set), it becomes *instructions*: the exact
 *     figure including whatever code applied, the reference to quote, and the
 *     screenshot step made unmissable. A transfer with no screenshot and no
 *     reference is a payment we cannot match to a person, and chasing it is the
 *     single most common way a manual booking goes wrong.
 *
 * Renders nothing at all until the details are configured. A payment section
 * with a blank account number is worse than no payment section.
 */
export function PaymentDetails({
  tripTitle,
  amount,
  reference,
  className,
}: {
  tripTitle?: string;
  /** The confirmed figure, promo applied. Omit before a request is sent. */
  amount?: number | null;
  /** Short request reference, quoted in the transfer note. */
  reference?: string | null;
  className?: string;
}) {
  if (!hasPaymentDetails()) return null;

  const { upiId, upiQr, accountName, bankName, accountNumber, ifsc } = site.bank;
  const hasBank = Boolean(accountName && bankName && accountNumber && ifsc);
  const quoted = typeof amount === "number" && amount > 0;

  const whatsapp = whatsappLink(
    quoted
      ? `Hi Outway, I've paid ${formatINR(amount)}${
          reference ? ` for request ${reference}` : ""
        }${tripTitle ? ` (${tripTitle})` : ""}. Screenshot attached.`
      : tripTitle
        ? `Hi Outway, I've paid for ${tripTitle}. Here's the screenshot.`
        : "Hi Outway, here's my payment screenshot."
  );

  return (
    <section className={clsx("rounded-2xl border border-border bg-white p-6", className)}>
      <h2 className="heading-sm flex items-center gap-2 text-lg text-ink">
        <IndianRupee size={18} className="text-pine" aria-hidden="true" /> Payment details
      </h2>

      {quoted ? (
        <>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-500">
            Once we&apos;ve confirmed your seat is genuinely free — within {site.responseTime} —
            this is what you pay and where. Nothing is charged on this website, and please
            don&apos;t transfer anything before you hear from us.
          </p>

          <div className="mt-5 rounded-xl bg-pine-50 px-4 py-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-pine-600">Amount to pay</span>
              <span className="font-display text-2xl font-semibold text-pine-600">
                {formatINR(amount)}
              </span>
            </div>
            {reference && (
              <p className="mt-1.5 text-xs leading-relaxed text-pine-600/80">
                Put <strong className="font-mono font-semibold">{reference}</strong> in the payment
                note so we can match it to you straight away.
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="mt-2.5 text-sm leading-relaxed text-ink-500">
          Nothing is charged on this website. You send the booking request first, we confirm the
          seat is genuinely free and tell you the exact amount, and only then do you pay — by UPI or
          a bank transfer, to the account below.
        </p>
      )}

      {(upiId || upiQr) && (
        <div className="mt-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Smartphone size={15} className="text-pine" aria-hidden="true" /> UPI
          </p>

          <div className="mt-1.5 flex flex-col gap-4 sm:flex-row sm:items-center">
            {upiQr && (
              <figure className="shrink-0 rounded-xl border border-border bg-white p-3 text-center">
                {/* A plain <img>, deliberately. A QR is a small fixed-size PNG
                    whose one job is to survive a phone camera, so it wants no
                    optimizer between it and the screen — and this way the value
                    can be a /public path or any URL without needing a
                    remotePatterns entry in next.config.mjs. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={upiQr}
                  alt={`UPI QR code for ${accountName || site.name}`}
                  width={148}
                  height={148}
                  className="mx-auto h-[148px] w-[148px] object-contain"
                  loading="lazy"
                />
                <figcaption className="mt-2 text-[11px] leading-tight text-ink-500">
                  Scan in GPay, PhonePe, Paytm
                  <br /> or any banking app
                </figcaption>
              </figure>
            )}

            {upiId && (
              <div className="min-w-0 flex-1 rounded-xl bg-cream-300 px-4 py-1">
                <CopyValue label="UPI ID" value={upiId} />
              </div>
            )}
          </div>

          {/* The one check that catches a swapped QR or a lookalike UPI ID
              before the money moves, rather than after. */}
          {accountName && (
            <p className="mt-2.5 text-xs leading-relaxed text-ink-500">
              Your app should show{" "}
              <strong className="font-semibold text-ink-700">{accountName}</strong> before you
              confirm. Any other name means stop.
            </p>
          )}
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

      {/* --- The screenshot ---------------------------------------------------
          Given its own block rather than a closing sentence, because it is a
          step rather than a courtesy. A transfer we cannot see is a transfer we
          cannot match, and the seat stays unconfirmed while somebody's money
          has already left. */}
      <div className="mt-5 rounded-xl border border-clay-100 bg-clay-50/60 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Camera size={15} className="text-clay" aria-hidden="true" /> Then send us the screenshot
          — every time, without fail
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
          Your booking is confirmed when we say it is, in writing, not when the transfer leaves your
          account. The screenshot is how we match your payment to your seat
          {reference ? ` — quote ${reference}` : ""}.
        </p>

        <div className="mt-3.5 flex flex-wrap gap-2">
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-sm"
            >
              <MessageCircle size={14} aria-hidden="true" /> Send it on WhatsApp
            </a>
          )}
          <a
            href={`mailto:${site.email}?subject=${encodeURIComponent(
              `Payment screenshot${reference ? ` · ${reference}` : ""}${
                tripTitle ? ` · ${tripTitle}` : ""
              }`
            )}`}
            className="btn-outline btn-sm"
          >
            Email it instead
          </a>
        </div>
      </div>

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
