"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { AlertCircle, Check, Info, Loader2, Sparkles, Tag, X } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { networkError } from "@/lib/error-messages";
import type { AppliedPromo } from "@/lib/types";

/**
 * The price, and the one code that may change it.
 *
 * Every figure on screen here comes back from `/api/promo/validate`, which
 * prices the order from the trip's own row — this component does no arithmetic
 * at all. That is deliberate: if the browser computed the total, the total
 * would be a suggestion, and the number the customer was shown could disagree
 * with the number we stored. Here they cannot, because they are the same
 * number from the same place.
 *
 * One code, never two. There is a single `applied` slot; applying replaces
 * whatever was in it. When an event code is already on the order and someone
 * enters a collaborator's, the server decides which survives and sends back a
 * line explaining it rather than silently picking.
 */
export function PromoPricing({
  tripId,
  departureId,
  travelers,
  fallbackPricePerPerson,
  initialPromo,
  onChange,
  className,
}: {
  tripId: string;
  departureId: string | null;
  travelers: number;
  /** Shown until the first quote lands, so the panel is never blank. */
  fallbackPricePerPerson: number;
  /**
   * The auto-applying offer, priced on the server for this page render.
   *
   * Not an optimisation. Without it the panel opens at full price and only
   * shows the discount once a fetch returns — so a throttled or failed request
   * silently removes a live offer, and the booking form quietly contradicts the
   * trip page the customer just came from. Starting from the server's answer
   * means the worst a failed fetch can do is leave a correct number on screen.
   */
  initialPromo?: AppliedPromo | null;
  /** Lifted so the form can send the code and quote the total back on success. */
  onChange?: (quote: { code: string | null; total: number; discount: number }) => void;
  className?: string;
}) {
  const [input, setInput] = useState("");
  const [applied, setApplied] = useState<AppliedPromo | null>(initialPromo ?? null);
  // Text plus how it should read. A refusal and a confirmation are both
  // "notices" as far as the server is concerned, but showing "already applied"
  // in the same red as "that code isn't one of ours" sends people hunting for a
  // problem that isn't there.
  const [notice, setNotice] = useState<{ text: string; tone: "error" | "info" } | null>(null);
  const [quote, setQuote] = useState<{ subtotal: number; pricePerPerson: number } | null>(null);
  const [checking, setChecking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // The code the *server* accepted, not the one in the box. Re-quoting after a
  // headcount change has to re-send what is actually applied — sending the box
  // would re-apply a code the customer had already been told was invalid.
  const activeCode = useRef<string | null>(initialPromo?.code ?? null);
  // Drops the answer to a request that has been overtaken by a newer one.
  // Without it, tapping the stepper four times can settle on the second reply.
  const requestId = useRef(0);

  const quotePrice = useCallback(
    async (code: string | null, options: { explicit?: boolean } = {}) => {
      const id = ++requestId.current;
      if (options.explicit) setChecking(true);

      try {
        const response = await fetch("/api/promo/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tripId, departureId, travelers, code }),
        });

        if (id !== requestId.current) return;

        if (!response.ok) {
          // Deliberately leaves `applied` alone. A failed re-quote must not
          // take a discount off the screen that the server already granted —
          // and the request is priced server-side on submit regardless, so the
          // stale figure here can never become the stored one.
          if (options.explicit) {
            setNotice({
              tone: "error",
              text:
                response.status === 429
                  ? "That's a lot of tries in a short while. Give it a minute."
                  : "We couldn't check that code just now. Try again in a moment.",
            });
          }
          return;
        }

        const data = (await response.json()) as {
          subtotal: number;
          pricePerPerson: number;
          applied: AppliedPromo | null;
          notice: string | null;
          noticeTone: "error" | "info";
        };

        if (id !== requestId.current) return;

        setQuote({ subtotal: data.subtotal, pricePerPerson: data.pricePerPerson });
        setApplied(data.applied);
        activeCode.current = data.applied?.code ?? null;

        // Refusals are shown on background re-quotes too, and that matters: a
        // code with a minimum spend can stop applying when someone drops from
        // two travellers to one, and silently removing the discount is how you
        // get "the price went up when I changed something" support emails.
        //
        // Confirmations are not. A re-quote sends the code that is already
        // applied, so every stepper tap would otherwise announce that it is
        // already applied — to someone who never asked.
        setNotice(
          data.notice && (options.explicit || data.noticeTone === "error")
            ? { text: data.notice, tone: data.noticeTone }
            : null
        );

        // Only when the server took *this* code. An auto offer is still
        // `applied` after a typed code is refused, and clearing the box on that
        // left "check the spelling and try again" pointing at an empty field.
        if (options.explicit && code && data.applied?.code.toUpperCase() === code.toUpperCase()) {
          setInput("");
        }
      } catch {
        if (id === requestId.current && options.explicit) {
          setNotice({ text: networkError(), tone: "error" });
        }
      } finally {
        if (id === requestId.current && options.explicit) setChecking(false);
      }
    },
    [tripId, departureId, travelers]
  );

  // Re-price on mount and whenever the date or the headcount moves. This is
  // also what makes the event code appear without anyone typing anything.
  useEffect(() => {
    void quotePrice(activeCode.current);
  }, [quotePrice]);

  useEffect(() => {
    onChange?.({
      code: applied?.code ?? null,
      total: applied?.total ?? quote?.subtotal ?? fallbackPricePerPerson * travelers,
      discount: applied?.discountAmount ?? 0,
    });
    // onChange is a parent setState; including it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, quote, travelers, fallbackPricePerPerson]);

  const subtotal = quote?.subtotal ?? fallbackPricePerPerson * travelers;
  const perPerson = quote?.pricePerPerson ?? fallbackPricePerPerson;
  const total = applied ? applied.total : subtotal;

  function removeCode() {
    // Clearing a typed code falls back to whatever applies on its own, which
    // may well be the event offer — so this re-quotes rather than zeroing out.
    activeCode.current = null;
    setNotice(null);
    void quotePrice(null, { explicit: true });
  }

  return (
    // Square-cornered by design: this is the top band of a taller cream panel,
    // and the caller rounds the outside. Rounding here as well left a visible
    // step where the two blocks met.
    <div className={clsx("bg-cream-300 px-4 py-3.5 text-sm text-ink-700", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <span>
          {formatINR(perPerson)} × {travelers}
        </span>
        <span className={applied ? "text-ink-500" : "heading-sm text-base text-ink"}>
          {formatINR(subtotal)}
        </span>
      </div>

      {applied && (
        <div className="mt-2 flex items-baseline justify-between gap-4 text-pine">
          <span className="flex min-w-0 items-center gap-1.5">
            {applied.auto ? (
              <Sparkles size={14} className="shrink-0" aria-hidden="true" />
            ) : (
              <Check size={14} className="shrink-0" aria-hidden="true" />
            )}
            <span className="truncate font-medium">{applied.label}</span>
            <span className="shrink-0 rounded bg-pine/10 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider">
              {applied.code}
            </span>
          </span>
          <span className="shrink-0 font-medium">−{formatINR(applied.discountAmount)}</span>
        </div>
      )}

      {applied && (
        <div className="mt-2.5 flex items-baseline justify-between gap-4 border-t border-border/70 pt-2.5">
          <span className="font-medium text-ink">You pay</span>
          <output aria-live="polite" className="heading-sm text-base text-ink">
            {formatINR(total)}
          </output>
        </div>
      )}

      {/* --- The code box -----------------------------------------------------
          Collapsed by default. An open, empty "promo code" field is an
          invitation to go and look for one somewhere else before booking. */}
      <div className="mt-3 border-t border-border/70 pt-3">
        {applied && !applied.auto ? (
          <button
            type="button"
            onClick={removeCode}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-clay"
          >
            <X size={13} aria-hidden="true" /> Remove {applied.code}
          </button>
        ) : expanded ? (
          <div className="flex flex-wrap gap-2">
            <label htmlFor="promo-code-input" className="sr-only">
              Promo code
            </label>
            <input
              id="promo-code-input"
              value={input}
              onChange={(event) => {
                setInput(event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase());
                setNotice(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (input) void quotePrice(input, { explicit: true });
                }
              }}
              placeholder="Enter a code"
              maxLength={40}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-lg border border-border-control bg-white px-3 py-2 font-mono text-sm uppercase tracking-wider focus:border-pine focus:outline-none"
            />
            <button
              type="button"
              onClick={() => input && void quotePrice(input, { explicit: true })}
              disabled={checking || input.length < 3}
              className="btn-outline btn-sm shrink-0"
            >
              {checking ? <Loader2 size={13} className="animate-spin" /> : <Tag size={13} />}
              {checking ? "Checking…" : "Apply"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-pine"
          >
            <Tag size={13} aria-hidden="true" />
            {applied ? "Got a different code?" : "Have a promo code?"}
          </button>
        )}

        {notice && (
          <p
            aria-live="polite"
            className={clsx(
              "mt-2 flex items-start gap-1.5 text-xs leading-relaxed",
              notice.tone === "error" ? "text-clay-600" : "text-pine"
            )}
          >
            {notice.tone === "error" ? (
              <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            )}
            {notice.text}
          </p>
        )}
      </div>
    </div>
  );
}
