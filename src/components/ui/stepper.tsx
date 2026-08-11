"use client";

import { useId } from "react";
import { Minus, Plus } from "lucide-react";

/**
 * A number you nudge up and down.
 *
 * The buttons are 44px because the pair this replaced were 28px circles sat
 * 12px apart, which on a phone is a coin toss between "one more traveller"
 * and "one fewer". The value is an `output` with aria-live, so the change is
 * announced instead of silently happening somewhere on screen.
 */
export function Stepper({
  value,
  min = 1,
  max,
  onChange,
  label,
  decrementLabel,
  incrementLabel,
  /** Optional line under the control, e.g. why max is what it is. */
  hint,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  label: string;
  decrementLabel: string;
  incrementLabel: string;
  hint?: string;
}) {
  const labelId = useId();

  return (
    <div>
      {/* The row labels itself. A `field-label` above it as well just printed
          "Travellers" twice, half a centimetre apart. */}
      <div className="flex items-center justify-between rounded-xl border border-border-control px-3 py-1.5">
        <span id={labelId} className="text-sm font-medium text-ink-700">
          {label}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
            aria-label={decrementLabel}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-pine-50 hover:text-pine disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <output
            aria-live="polite"
            aria-labelledby={labelId}
            className="w-7 text-center text-base font-semibold text-ink"
          >
            {value}
          </output>
          <button
            type="button"
            onClick={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
            aria-label={incrementLabel}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-pine-50 hover:text-pine disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      {hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
