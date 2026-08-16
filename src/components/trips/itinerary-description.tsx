"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

/**
 * A day's prose, collapsed to three lines until asked for.
 *
 * Each description runs to around 190 words, and four of them stacked turned
 * the itinerary into a wall — the one section a reader is most likely to skim
 * and most likely to be sold by. Clamping keeps each day's title, timeline
 * chips and meal line within reach while leaving the full text one click away,
 * rather than cutting copy that is doing real work.
 *
 * Whether to clamp is decided from the character count rather than by measuring
 * the rendered paragraph. Measuring needs an effect, which means a first paint
 * with no button followed by a visible jump once it appears; a threshold is
 * decided during render and is stable between server and client. A genuinely
 * short day renders as a plain paragraph with no control at all.
 *
 * `line-clamp` is visual only — the full text stays in the DOM, so screen
 * readers and Googlebot both get the whole thing either way.
 */
const CLAMP_ABOVE = 260;

export function ItineraryDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();

  if (text.length <= CLAMP_ABOVE) {
    return <p className="mt-2 leading-relaxed text-ink-500">{text}</p>;
  }

  return (
    <div className="mt-2">
      <p
        id={id}
        className={clsx("leading-relaxed text-ink-500", !expanded && "line-clamp-3")}
      >
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
