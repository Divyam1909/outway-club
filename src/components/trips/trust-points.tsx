import { clsx } from "clsx";
import { Star } from "lucide-react";
import { TRUST_POINTS } from "@/config/site";

/**
 * The three reassurances that sit against the price.
 *
 * Deliberately next to the number rather than at the foot of the page: the
 * doubt this answers ("what happens after I press this?") arrives at the
 * moment someone reads the price, not two screens later. Copy lives in
 * TRUST_POINTS — see the note there about only claiming what we can evidence.
 */
export function TrustPoints({
  className,
  align = "center",
}: {
  className?: string;
  align?: "start" | "center";
}) {
  return (
    <ul className={clsx("space-y-1.5", className)}>
      {TRUST_POINTS.map((point) => (
        <li
          key={point}
          className={clsx(
            "flex items-start gap-2 text-xs leading-relaxed text-ink-500",
            align === "center" && "justify-center text-center"
          )}
        >
          {/* Filled gold-400 with a gold-600 stroke: the bright tone alone is
              documented as pine-only, and the darker outline is what keeps the
              mark visible on cream and white. */}
          <Star
            size={13}
            className="mt-0.5 shrink-0 fill-gold-400 text-gold-600"
            aria-hidden="true"
          />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}
