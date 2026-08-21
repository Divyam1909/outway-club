"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

/**
 * Long prose, collapsed to a few lines until asked for.
 *
 * Two places lean on this. Each itinerary day runs to around 190 words, and
 * four of them stacked turned the schedule into a wall — the one section a
 * reader is most likely to skim and most likely to be sold by. The trip
 * overview under the H1 has the same problem for the same reason: it sits
 * between the price and the journey strip, and a reader who has to scroll
 * past a full screen of paragraph to reach the dates often just doesn't.
 * Clamping keeps what surrounds it within reach and leaves the full text one
 * click away, rather than cutting copy that is doing real work.
 *
 * Whether to clamp is decided from the character count rather than by
 * measuring the rendered paragraph. Measuring needs an effect, which means a
 * first paint with no button followed by a visible jump once it appears; a
 * threshold is decided during render and is stable between server and client.
 * Genuinely short text renders as a plain paragraph with no control at all.
 *
 * `line-clamp` is visual only — the full text stays in the DOM, so screen
 * readers and Googlebot both get the whole thing either way.
 */

/** Spelled out because Tailwind only ships the classes it can see. */
const CLAMP = {
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
} as const;

export function ExpandableProse({
  text,
  lines = 3,
  clampAbove = 260,
  className,
  wrapperClassName = "mt-2",
}: {
  text: string;
  lines?: keyof typeof CLAMP;
  /** Below this many characters the text isn't long enough to be worth hiding. */
  clampAbove?: number;
  className?: string;
  wrapperClassName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();

  const prose = clsx("leading-relaxed text-ink-500", className);

  if (text.length <= clampAbove) {
    return <p className={clsx(wrapperClassName, prose)}>{text}</p>;
  }

  return (
    <div className={wrapperClassName}>
      <p id={id} className={clsx(prose, !expanded && CLAMP[lines])}>
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls={id}
        className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-pine transition-colors hover:text-clay"
      >
        {expanded ? "Show less" : "Read more"}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={clsx("transition-transform", expanded && "rotate-180")}
        />
      </button>
    </div>
  );
}
