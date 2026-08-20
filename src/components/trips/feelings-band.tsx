import { splitLead } from "@/lib/utils";

/**
 * The three-beat summary of what an escape actually does to you:
 *
 *   Jawai — Discover · Udaipur — Experience · Outway — Connect
 *
 * Two places and the company, because the third one is the claim the other two
 * exist to support. It sits directly under the trip title, before any list,
 * because it is the shortest honest answer to "what is this?" and a reader who
 * bounces after four seconds should still have read it.
 *
 * Written for three items. The layout takes however many it is given, but a
 * fourth beat dilutes a line whose whole value is that it is memorable.
 */
export function FeelingsBand({ feelings }: { feelings: string[] }) {
  if (feelings.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-stretch gap-2.5">
      {feelings.map((feeling) => {
        const { lead, body } = splitLead(feeling);
        return (
          <li
            key={feeling}
            className="flex items-baseline gap-2 rounded-full border border-border bg-white px-4 py-2"
          >
            {lead && (
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {lead}
              </span>
            )}
            <span className="font-display text-base font-semibold text-pine">{body}</span>
          </li>
        );
      })}
    </ul>
  );
}
