import { Check, X } from "lucide-react";
import { splitLead } from "@/lib/utils";

/**
 * "Who this is for" and "Not for you if".
 *
 * The second column is the one that does the work. Anybody can list who they
 * want; naming who will be disappointed is a claim about everyone else, and it
 * is also the cheapest possible way to stop the wrong person booking — which
 * on a shared eighteen-person trip costs seventeen other people their evening.
 *
 * The two columns are given equal visual weight on purpose. Shrinking the
 * "not for you" side into a footnote would turn an honest qualifier into a
 * disclaimer, which is the opposite of the point.
 */
export function WhoItsFor({ whoFor, notFor }: { whoFor: string[]; notFor: string[] }) {
  if (whoFor.length === 0 && notFor.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {whoFor.length > 0 && (
        <div className="rounded-2xl border border-pine-100 bg-pine-50/60 p-6">
          <h3 className="mb-4 flex items-center gap-2 heading-sm text-lg text-ink">
            <Check size={18} className="text-pine" aria-hidden="true" /> This is for you if
          </h3>
          <ul className="space-y-3.5">
            {whoFor.map((item) => {
              const { lead, body } = splitLead(item);
              return (
                <li key={item} className="text-sm leading-relaxed text-ink-700">
                  <span className="font-medium text-ink">{lead ?? body}</span>
                  {lead && <span className="text-ink-500"> — {body}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {notFor.length > 0 && (
        <div className="rounded-2xl border border-border bg-cream-300/70 p-6">
          <h3 className="mb-4 flex items-center gap-2 heading-sm text-lg text-ink">
            <X size={18} className="text-clay" aria-hidden="true" /> Not for you if
          </h3>
          <ul className="space-y-3.5">
            {notFor.map((item) => {
              const { lead, body } = splitLead(item);
              return (
                <li key={item} className="text-sm leading-relaxed text-ink-700">
                  <span className="font-medium text-ink">{lead ?? body}</span>
                  {lead && <span className="text-ink-500"> — {body}</span>}
                </li>
              );
            })}
          </ul>
          <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-ink-500">
            We would genuinely rather you read this and book something else than read it
            afterwards.
          </p>
        </div>
      )}
    </div>
  );
}
