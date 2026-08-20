import { MessageCircle } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { splitLead } from "@/lib/utils";

/**
 * "What you're really booking."
 *
 * The counterweight to the inclusions list. Inclusions have to be literal —
 * a bed, a jeep, a meal — and read like a receipt however carefully they are
 * written. This says the other true thing: that the receipt is not the reason
 * anybody comes back. Both are on the page; this one comes first, because a
 * reader who has only seen the receipt has been told the least interesting
 * half of the product.
 *
 * Rendered on pine so it reads as a statement rather than another list.
 */
export function ReallyBooking({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-3xl bg-pine-700 px-7 py-9 text-cream-100 sm:px-10 sm:py-11">
      <Eyebrow tone="dark" className="mb-3">
        What you&apos;re really booking
      </Eyebrow>
      <h2 className="max-w-lg font-display text-2xl font-semibold leading-tight sm:text-3xl">
        Not a bus seat, a hotel room and a list of monuments.
      </h2>

      <ul className="mt-8 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        {items.map((item) => {
          const { lead, body } = splitLead(item);
          return (
            <li key={item} className="flex items-start gap-3">
              <MessageCircle
                size={16}
                className="mt-0.5 shrink-0 text-gold"
                aria-hidden="true"
              />
              <span className="text-sm leading-relaxed text-cream-100/80">
                {lead && <strong className="font-semibold text-cream-100">{lead}. </strong>}
                {body}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
