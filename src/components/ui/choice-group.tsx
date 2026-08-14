"use client";

import { clsx } from "clsx";
import { AlertCircle, Check } from "lucide-react";

export interface ChoiceOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * One question, one answer, shown as cards rather than a dropdown.
 *
 * A `<select>` hides the options behind a tap, which is exactly wrong for a
 * questionnaire — people answer these honestly only when they can see that the
 * quiet answer is as acceptable as the loud one. Underneath it is a plain radio
 * group: real inputs, real labels, arrow keys, and the focus ring on the card
 * instead of on a hidden dot.
 */
export function ChoiceGroup({
  name,
  legend,
  help,
  options,
  value,
  onChange,
  error,
  columns = 1,
  firstInputRef,
}: {
  name: string;
  legend: string;
  help?: string;
  options: readonly ChoiceOption[];
  value: string;
  onChange: (next: string) => void;
  error?: string;
  columns?: 1 | 2;
  /** Attached to the first radio so a failed step can focus the question. */
  firstInputRef?: (node: HTMLInputElement | null) => void;
}) {
  const errorId = `${name}-error`;

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="heading-sm text-base text-ink">{legend}</legend>
      {help && <p className="mt-1 text-sm leading-relaxed text-ink-500">{help}</p>}

      <div
        className={clsx(
          "mt-3.5 grid gap-2",
          columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
        )}
      >
        {options.map((option, index) => {
          const selected = option.value === value;

          return (
            <label
              key={option.value}
              className={clsx(
                "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                "focus-within:ring-2 focus-within:ring-clay focus-within:ring-offset-0",
                selected
                  ? "border-pine bg-pine-50"
                  : "border-border-control bg-white hover:border-pine",
                error && !selected && "border-clay-600/40"
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                ref={index === 0 ? firstInputRef : undefined}
                aria-invalid={error ? true : undefined}
                className="sr-only"
              />

              <span
                aria-hidden="true"
                className={clsx(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selected ? "border-pine bg-pine text-cream-100" : "border-ink/30 bg-white"
                )}
              >
                {selected && <Check size={13} strokeWidth={3} />}
              </span>

              <span className="min-w-0">
                <span
                  className={clsx(
                    "block text-sm font-medium",
                    selected ? "text-pine-600" : "text-ink"
                  )}
                >
                  {option.label}
                </span>
                {option.hint && (
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                    {option.hint}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <p id={errorId} className="field-error-text">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  );
}
