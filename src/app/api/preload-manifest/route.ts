import { NextResponse } from "next/server";
import { getCatalogueTrips, getDestinationsWithAvailability } from "@/lib/data";
import { getPublishedPosts } from "@/lib/blog";

/**
 * What the browser should warm up in the background once the first page is
 * interactive, so moving around the site feels instant instead of re-fetching
 * a hero photograph on every navigation.
 *
 * It is a *manifest*, not the assets: the client component decides whether to
 * act on it at all (it skips on Save-Data and slow connections) and pulls each
 * image through next/image with the same `sizes` string the real page uses, so
 * the warmed URL is byte-for-byte the one the destination page will ask for. A
 * different `sizes` would warm a different width and cache nothing useful.
 *
 * Deliberately not part of the root layout's render: fetching this on the
 * server would put two database round trips in front of every page in the app,
 * including the admin console, to speed up a navigation that may never happen.
 */

/** Hard ceiling on how much we're willing to pull down speculatively. */
const MAX_IMAGES = 24;

export const revalidate = 300;

type PreloadImage = { src: string; sizes: string };

/** The `sizes` strings in use across the site, kept in one place. */
const SIZES = {
  tripCard: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  destinationTile: "(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 70vw",
  explorerPanel: "(min-width: 1024px) 55vw, 100vw",
  tripGallery: "(min-width: 640px) 60vw, 100vw",
  postCard: "(max-width: 768px) 100vw, 33vw",
} as const;

export async function GET() {
  const [destinations, trips, posts] = await Promise.all([
    getDestinationsWithAvailability(),
    getCatalogueTrips(),
    getPublishedPosts({ limit: 6 }).catch(() => []),
  ]);

  const images: PreloadImage[] = [];
  const seen = new Set<string>();

  function add(src: string | null | undefined, sizes: string) {
    if (!src || images.length >= MAX_IMAGES) return;
    const key = `${src}::${sizes}`;
    if (seen.has(key)) return;
    seen.add(key);
    images.push({ src, sizes });
  }

  // Order matters — the list is warmed front to back, so the images a visitor
  // is most likely to meet next come first.
  for (const trip of trips) add(trip.hero_image, SIZES.tripCard);
  for (const destination of destinations) add(destination.hero_image, SIZES.destinationTile);

  // The one big panel on the homepage explorer, for destinations we actually
  // run trips to — that's all the explorer shows.
  for (const destination of destinations.filter((d) => d.tripCount > 0).slice(0, 4)) {
    add(destination.hero_image, SIZES.explorerPanel);
  }

  // The main image on a trip page, which is the most likely next click.
  for (const trip of trips.slice(0, 4)) add(trip.hero_image, SIZES.tripGallery);

  for (const post of posts) add(post.cover_image, SIZES.postCard);

  const routes = [
    "/trips",
    "/testimonials",
    "/about",
    "/blog",
    "/contact",
    "/faq",
    ...trips.slice(0, 3).map((trip) => `/trips/${trip.slug}`),
    ...destinations
      .filter((destination) => destination.tripCount > 0)
      .slice(0, 3)
      .map((destination) => `/destinations/${destination.slug}`),
  ];

  return NextResponse.json(
    { images, routes },
    {
      headers: {
        // Safe to share: nothing here depends on who is asking.
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
      },
    }
  );
}
