import { clsx } from "clsx";
import { Sparkles } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { publicDiscount, type PublicPromo } from "@/lib/promo-rules";

/**
 * The strip that says an offer is running.
 *
 * Driven entirely by the promo row, which is what makes it honest: it appears
 * because a live, auto-applying code exists, it quotes that code's actual
 * arithmetic, and it disappears the moment the code's window closes without
 * anybody remembering to take it down. There is no "is the festival on" flag
 * compiled into a component anywhere on this site.
 */
export function PromoBanner({
  promo,
  pricePerPerson,
  tone = "light",
  className,
}: {
  promo: PublicPromo;
  pricePerPerson: number;
  /** "dark" for use on the pine bands. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const discount = publicDiscount(promo, pricePerPerson, 1);
  if (discount <= 0) return null;

  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-full px-4 py-2 text-sm",
        tone === "dark" ? "bg-cream-100/15 text-cream-100" : "bg-gold-100 text-gold-600",
        className
      )}
    >
      <Sparkles size={15} className="shrink-0" aria-hidden="true" />
      <span className="font-semibold">{promo.label}</span>
      <span className={tone === "dark" ? "text-cream-100/80" : "text-gold-600/85"}>
        {formatINR(discount)} off per traveller, applied automatically
      </span>
      {promo.ends_at && (
        <span
          className={clsx(
            "rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
            tone === "dark" ? "bg-cream-100/15" : "bg-white/70"
          )}
        >
          {endsLabel(promo.ends_at)}
        </span>
      )}
    </div>
  );
}

/**
 * "Until 4 Sep" rather than a live countdown.
 *
 * A ticking timer would have to be a client component, would differ between the
 * prerendered HTML and the first paint, and is the visual language of a fake
 * urgency banner. The date is the true thing and it renders on the server.
 */
function endsLabel(endsAt: string): string {
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return "Limited time";

  const days = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "Ends today";
  if (days === 1) return "Ends tomorrow";
  if (days <= 14) return `${days} days left`;

  return `Until ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
}
