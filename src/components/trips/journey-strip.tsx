import { splitLead } from "@/lib/utils";

/**
 * The visual journey: Delhi → people → Jawai → wildlife → sunset → stories →
 * Udaipur → lake → final dinner → return.
 *
 * Deliberately not one node per day. The itinerary below it already does days;
 * this is the emotional arc, and it has more beats than the trip has mornings
 * — which is the entire difference between selling a journey and selling a
 * schedule.
 *
 * Horizontal and scrollable on a phone, wrapping on a desktop. It scrolls
 * inside its own track rather than pushing the page sideways: a route with ten
 * beats will not fit in 360px and shortening the route to suit a viewport is
 * the wrong fix.
 */
export function JourneyStrip({ route }: { route: string[] }) {
  if (route.length === 0) return null;

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <ol className="flex min-w-max gap-3 sm:min-w-0 sm:flex-wrap">
        {route.map((step, index) => {
          const { lead, body } = splitLead(step);
          return (
            <li
              key={step}
              className="relative flex w-56 shrink-0 flex-col rounded-2xl border border-border bg-white p-4 shadow-soft sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
            >
              <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-pine-50 text-[10px] font-semibold text-pine">
                {String(index + 1).padStart(2, "0")}
              </span>
              {lead && (
                <span className="heading-sm text-sm text-ink">{lead}</span>
              )}
              <span className="mt-1 text-xs leading-relaxed text-ink-500">{body}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
