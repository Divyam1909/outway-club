/**
 * The people who actually run the departures.
 *
 * Every trip page, the FAQ, the terms and the joining email all say "your trip
 * captain" — and until now the site never showed one. This is where they live.
 *
 * They're in code rather than the database for the same reason the pipeline is:
 * a captain isn't a trip, there is no admin screen that would own them, and
 * there are two or three of them, not two hundred. When that stops being true,
 * move them to a `captains` table and this file becomes the seed.
 *
 * Rules, same as everywhere else on this site:
 *   - A real person, a real name, and a photo of them. Not a stock portrait.
 *   - One line of bio. It should say why they're the right person on this
 *     route, not list a CV.
 *   - Leave the array empty rather than inventing someone. The trip page then
 *     explains what a trip captain does and shows nobody, which is honest;
 *     a made-up face would not be.
 *
 * To add one: drop the photo in /public/images/team/, then:
 *
 *   {
 *     name: "Riya Sharma",
 *     role: "Trip captain",
 *     bio: "Has driven the Udaipur–Mount Abu ghat road in every month of the year, including the two you shouldn't.",
 *     photo: "/images/team/riya.jpg",
 *     trips: ["udaipur-mount-abu"],
 *   }
 */

export type TripCaptain = {
  name: string;
  /** Shown under the name, e.g. "Trip captain" or "Trip captain, Rajasthan". */
  role: string;
  /** One line. What makes them the right person on this route. */
  bio: string;
  /** Path under /public. Omit and the card falls back to a branded panel. */
  photo?: string;
  /**
   * Trip slugs this person leads. Omit to make them the captain shown on any
   * trip that doesn't name someone else.
   */
  trips?: string[];
};

export const TRIP_CAPTAINS: TripCaptain[] = [];

/** The captain for a given trip: the named one, else the default, else none. */
export function captainForTrip(slug: string): TripCaptain | null {
  const named = TRIP_CAPTAINS.find((captain) => captain.trips?.includes(slug));
  if (named) return named;
  return TRIP_CAPTAINS.find((captain) => !captain.trips?.length) ?? null;
}
