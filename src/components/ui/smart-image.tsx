"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { clsx } from "clsx";

/**
 * next/image with a branded fallback.
 *
 * Real photography is dropped into /public/images (or uploaded to Supabase
 * Storage from the admin trip editor). Until a given photo exists, this
 * renders a deliberate Outway-toned panel instead of a broken-image icon —
 * so a half-populated gallery still looks designed rather than broken.
 */
export function SmartImage({
  src,
  alt,
  className,
  fallbackLabel,
  ...props
}: Omit<ImageProps, "src"> & { src: string | null | undefined; fallbackLabel?: string }) {
  const [failed, setFailed] = useState(false);
  const missing = !src || failed;

  if (missing) {
    return (
      <span
        aria-label={alt || undefined}
        role={alt ? "img" : "presentation"}
        className={clsx(
          "flex items-center justify-center overflow-hidden bg-gradient-to-br from-pine-500 via-pine-600 to-pine-700",
          props.fill ? "absolute inset-0 h-full w-full" : "h-full w-full",
          className
        )}
      >
        <span className="pointer-events-none flex flex-col items-center gap-2 px-4 text-center">
          <svg
            viewBox="0 0 48 32"
            className="h-8 w-12 text-cream-100/25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 29 15 9l9 12 6-7 17 15Z" />
            <circle cx="35" cy="7" r="3.5" />
          </svg>
          {fallbackLabel && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cream-100/45">
              {fallbackLabel}
            </span>
          )}
        </span>
      </span>
    );
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
