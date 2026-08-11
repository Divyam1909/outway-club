"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A modal dialog that behaves like one.
 *
 * Portalled to <body> so no ancestor's `overflow` or stacking context can clip
 * it, scroll-locked behind, closable on Escape and on a backdrop click, and
 * focus-trapped — with focus handed back to whatever opened it on close, which
 * is the part keyboard and screen-reader users actually notice when it's
 * missing.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  /** Wider dialog for form-heavy content. */
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (node) => node.offsetParent !== null
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement as HTMLElement | null;

    const { overflow, paddingRight } = document.body.style;
    // Compensate for the vanishing scrollbar so the page behind doesn't shift.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;

    document.addEventListener("keydown", handleKeyDown, true);

    // Focus the panel itself rather than its first control — that's the close
    // button here, and landing on "Close" reads like the dialog wants to be
    // dismissed. A screen reader announces the title from aria-labelledby.
    const frame = requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      openerRef.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto overscroll-contain bg-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        tabIndex={-1}
        className={`animate-fade-in relative my-0 w-full rounded-t-3xl bg-cream-100 shadow-lifted focus:outline-none sm:my-8 sm:rounded-3xl ${
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5 sm:px-8">
          <div>
            <h2 id="modal-title" className="heading-fluid text-xl text-ink sm:text-2xl">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="mt-1.5 text-sm leading-relaxed text-ink-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 shrink-0 rounded-full p-2 text-ink-500 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6 sm:px-8">{children}</div>
      </div>
    </div>,
    document.body
  );
}
