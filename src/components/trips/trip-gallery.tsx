"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";

/**
 * The hero mosaic, and the lightbox behind it.
 *
 * Before this, a trip with nine photographs showed five and gave the reader no
 * way to know the other four existed, let alone open them. The count is on the
 * page now, every tile opens the full set, and the viewer is a real dialog:
 * Escape closes it, arrow keys move through it, focus is trapped inside it and
 * handed back to the tile that opened it.
 */
export function TripGallery({
  heroImage,
  gallery,
  title,
}: {
  heroImage: string;
  gallery: string[];
  title: string;
}) {
  // The hero is the first frame of the set, so "photo 1 of 9" counts it.
  const photos = [heroImage, ...gallery].filter(Boolean);
  const thumbs = gallery.slice(0, 4);
  const [openAt, setOpenAt] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-2xl sm:grid-cols-[2fr_1fr]">
        <button
          type="button"
          onClick={() => setOpenAt(0)}
          aria-label={`Open photo 1 of ${photos.length}: ${title}`}
          className="group relative aspect-[4/3] w-full overflow-hidden sm:aspect-auto sm:min-h-[26rem]"
        >
          <SmartImage
            src={heroImage}
            alt={title}
            fill
            sizes="(min-width: 640px) 60vw, 100vw"
            priority
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
            fallbackLabel={title}
          />
        </button>

        {/* Hidden on a phone: stacked, the four thumbs added ~360px and pushed
            the trip's own name off the first screen. The count line below
            still says how many there are, and every one of them opens. */}
        {thumbs.length > 0 && (
          <div className="hidden grid-cols-2 gap-2 sm:grid sm:grid-rows-2">
            {thumbs.map((src, index) => {
              const isLast = index === thumbs.length - 1;
              const more = photos.length - thumbs.length - 1;

              return (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => setOpenAt(index + 1)}
                  aria-label={`Open photo ${index + 2} of ${photos.length}: ${title}`}
                  className="group relative aspect-square overflow-hidden sm:aspect-auto"
                >
                  <SmartImage
                    src={src}
                    alt={`${title}, photo ${index + 1}`}
                    fill
                    sizes="(min-width: 640px) 20vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                  />
                  {isLast && more > 0 && (
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/60 text-cream-100">
                      <Expand size={20} aria-hidden="true" />
                      <span className="text-sm font-semibold">+{more} more</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-2.5 text-sm text-ink-500">
        {photos.length} {photos.length === 1 ? "photograph" : "photographs"}, all taken on this
        route.{" "}
        <button
          type="button"
          onClick={() => setOpenAt(0)}
          className="font-medium text-pine underline underline-offset-2 hover:text-pine-600"
        >
          See them all
        </button>
      </p>

      {openAt !== null && (
        <Lightbox
          photos={photos}
          title={title}
          startAt={openAt}
          onClose={() => setOpenAt(null)}
        />
      )}
    </>
  );
}

function Lightbox({
  photos,
  title,
  startAt,
  onClose,
}: {
  photos: string[];
  title: string;
  startAt: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startAt);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  const go = useCallback(
    (step: number) => setIndex((i) => (i + step + photos.length) % photos.length),
    [photos.length]
  );

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      } else if (event.key === "ArrowRight") {
        go(1);
      } else if (event.key === "ArrowLeft") {
        go(-1);
      } else if (event.key === "Tab") {
        // Three controls, all inside the panel — keep Tab from walking out
        // into the page behind the overlay.
        const items = [...(panelRef.current?.querySelectorAll<HTMLElement>("button") ?? [])];
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    const frame = requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      openerRef.current?.focus?.();
    };
  }, [go, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex flex-col bg-ink/95 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${title}, photo ${index + 1} of ${photos.length}`}
        tabIndex={-1}
        className="flex h-full flex-col focus:outline-none"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 text-cream-100 sm:px-8">
          <p className="text-sm font-medium" aria-live="polite">
            {index + 1} of {photos.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close gallery"
            className="flex h-11 w-11 items-center justify-center rounded-full text-cream-100 transition-colors hover:bg-cream-100/15"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="relative flex-1">
          <SmartImage
            src={photos[index]}
            alt={`${title}, photo ${index + 1} of ${photos.length}`}
            fill
            sizes="100vw"
            className="object-contain"
            fallbackLabel={title}
          />
        </div>

        {photos.length > 1 && (
          <div className="flex items-center justify-center gap-4 px-5 py-5">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-cream-100/30 text-cream-100 transition-colors hover:bg-cream-100/15"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-cream-100/30 text-cream-100 transition-colors hover:bg-cream-100/15"
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
