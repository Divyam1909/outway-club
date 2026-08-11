import { Phone, Route, Users2 } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { captainForTrip } from "@/config/trip-captains";

/**
 * Who is actually going to be standing at the reporting point.
 *
 * The trip page, the FAQ, the terms and the joining email all refer to "your
 * trip captain"; this is the first place the reader gets to find out what that
 * means. When src/config/trip-captains.ts names someone for this trip they get
 * a face, a name and a line of bio. When it doesn't, the section still answers
 * the question — what the captain does and when you get their number — rather
 * than inventing a person to fill the frame.
 */

const DUTIES = [
  { icon: Route, text: "Runs the route, holds every booking reference and deals with what changes." },
  { icon: Users2, text: "Travels with the group start to finish. One captain, one group, no handovers." },
  { icon: Phone, text: "You get their direct number with the joining email, a few days before departure." },
];

export function TripCaptain({ tripSlug }: { tripSlug: string }) {
  const captain = captainForTrip(tripSlug);

  return (
    <div className="rounded-2xl border border-border bg-white p-6 sm:p-7">
      {captain ? (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-28">
            <SmartImage
              src={captain.photo}
              alt={captain.name}
              fill
              sizes="112px"
              className="object-cover"
              fallbackLabel={captain.name}
            />
          </div>
          <div>
            <p className="heading-sm text-xl text-ink">{captain.name}</p>
            <p className="mt-0.5 text-sm font-medium text-clay">{captain.role}</p>
            <p className="mt-2.5 leading-relaxed text-ink-500">{captain.bio}</p>
          </div>
        </div>
      ) : (
        <p className="leading-relaxed text-ink-500">
          Every departure runs with one Outway trip captain, and we name them here as soon as the
          roster for a date is fixed. Until then, here&apos;s what the job actually is — we&apos;d
          rather leave the space empty than put a stock photo in it.
        </p>
      )}

      <ul className="mt-6 space-y-3 border-t border-border pt-5">
        {DUTIES.map((duty) => (
          <li key={duty.text} className="flex items-start gap-3 text-sm leading-relaxed text-ink-700">
            <duty.icon size={17} className="mt-0.5 shrink-0 text-pine" aria-hidden="true" />
            {duty.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
