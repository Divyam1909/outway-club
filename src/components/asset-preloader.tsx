"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Warms the rest of the site once the current page is done loading, so moving
 * around feels like the assets were already there — because they were.
 *
 * Two halves:
 *
 * 1. **Routes.** `router.prefetch` pulls the RSC payload for the pages people
 *    actually go to next. <Link> already does this for links in the viewport;
 *    this covers the ones that aren't, and pages reached from a menu.
 *
 * 2. **Images.** Warmed by rendering hidden `next/image` elements carrying the
 *    same `sizes` string the destination page uses. That matters more than it
 *    looks: the optimizer serves a different URL per width, so warming a photo
 *    at the wrong `sizes` caches a variant nobody will ask for. Letting
 *    next/image build the srcset means the browser picks exactly the candidate
 *    it will pick on the real page, at the same DPR and viewport.
 *
 * Guard rails, because this spends someone else's data:
 * - nothing happens until `load` has fired, so it never competes with the
 *   current page's own images;
 * - it waits for an idle callback after that;
 * - it opts out entirely on Save-Data or a 2g/slow-2g connection;
 * - the manifest is capped server-side at 24 images.
 */

type PreloadImage = { src: string; sizes: string };
type Manifest = { images: PreloadImage[]; routes: string[] };

/** Bail out when the browser tells us bandwidth is precious. */
function shouldSkip(): boolean {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;

  if (!connection) return false;
  if (connection.saveData) return true;
  return connection.effectiveType === "slow-2g" || connection.effectiveType === "2g";
}

function whenIdle(run: () => void): () => void {
  const idle = (
    window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    }
  ).requestIdleCallback;

  if (idle) {
    const handle = idle(() => run(), { timeout: 4000 });
    return () => (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(handle);
  }

  const timer = window.setTimeout(run, 1500);
  return () => window.clearTimeout(timer);
}

/**
 * Sections where someone is working, not browsing. Speculatively pulling the
 * marketing site's photography behind a checkout or the admin console spends
 * bandwidth on pages they were never about to open.
 */
const NO_PRELOAD = ["/admin", "/booking", "/login", "/signup", "/reset-password"];

export function AssetPreloader() {
  const router = useRouter();
  const pathname = usePathname();
  const [images, setImages] = useState<PreloadImage[]>([]);

  const inactive = NO_PRELOAD.some((prefix) => pathname?.startsWith(prefix));

  useEffect(() => {
    if (inactive || shouldSkip()) return;

    let cancelled = false;
    let cancelIdle: (() => void) | undefined;

    async function warm() {
      try {
        const response = await fetch("/api/preload-manifest");
        if (!response.ok) return;
        const manifest = (await response.json()) as Manifest;
        if (cancelled) return;

        for (const route of manifest.routes) router.prefetch(route);
        setImages(manifest.images);
      } catch {
        // A speculative optimisation is never worth surfacing an error for.
      }
    }

    function start() {
      cancelIdle = whenIdle(() => void warm());
    }

    // `load` has already fired on a client-side navigation, so check first.
    if (document.readyState === "complete") {
      start();
    } else {
      window.addEventListener("load", start, { once: true });
    }

    return () => {
      cancelled = true;
      cancelIdle?.();
      window.removeEventListener("load", start);
    };
  }, [router, inactive]);

  if (images.length === 0) return null;

  return (
    // Parked off-screen rather than `display: none` — a hidden subtree can stop
    // the browser fetching the image at all, which would defeat the point.
    // Fixed and off to the left so it adds no layout, no scroll extent, and
    // sits nowhere near a real element: an on-screen 1px box, even one that's
    // transparent and pointer-events-none, still turns up in hit tests at the
    // top-left corner where the skip link and logo live.
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 h-px w-px overflow-hidden opacity-0"
      style={{ left: "-9999px" }}
    >
      {images.map((image) => (
        <span key={`${image.src}::${image.sizes}`} className="relative block h-px w-px">
          <Image
            src={image.src}
            alt=""
            fill
            sizes={image.sizes}
            loading="eager"
            fetchPriority="low"
            draggable={false}
          />
        </span>
      ))}
    </div>
  );
}
