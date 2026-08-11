/**
 * Places we intend to run, but haven't put on sale.
 *
 * These live in code rather than the `destinations` table on purpose. A
 * destination row implies a real page with real photography and a real trip
 * behind it; these have none of that yet, and giving them rows would mean
 * every destination query on the site had to learn to filter them out.
 *
 * They exist so a catalogue with one live escape still reads as a company with
 * a plan rather than an unfinished website. Nothing here is bookable, nothing
 * here has a price, and every card says so — the honest version of filling
 * empty space. An empty array is valid: the sections just render fewer cards.
 */

export type UpcomingDestination = {
  /** Used in the /coming-soon?place= query, so keep it the plain place name. */
  name: string;
  region: string;
  tagline: string;
  /** Honest status. "Under discussion" is a fine answer. */
  status: string;
  /**
   * Tailwind gradient classes for the card panel. No photography exists for
   * these yet and a stock photo would be exactly the pretending we avoid, so
   * each one gets a distinct tone instead.
   */
  tone: string;
};

export const UPCOMING_DESTINATIONS: UpcomingDestination[] = [
  {
    name: "Spiti Valley",
    region: "Himachal Pradesh",
    tagline: "Cold desert at 4,000m, and roads that simply end",
    status: "Being scouted for 2026",
    tone: "from-pine-400 via-pine-600 to-pine-700",
  },
  // Order matters: sections take the first N, so alternate the tones and
  // don't leave two greens sitting next to each other in a two-card row.
  {
    name: "Gokarna",
    region: "Karnataka",
    tagline: "Beaches you walk between, not drive between",
    status: "Winter 2026 to 2027",
    tone: "from-clay-400 via-clay-600 to-clay-700",
  },
  {
    name: "Meghalaya",
    region: "North East",
    tagline: "Living root bridges, and the wettest air in the country",
    status: "Route being planned",
    tone: "from-pine-500 via-pine-600 to-ink",
  },
  {
    name: "Jaisalmer",
    region: "Rajasthan",
    tagline: "Sandstone city, then two nights out in the dunes",
    status: "Late 2026",
    tone: "from-gold-600 via-clay-600 to-clay-700",
  },
  {
    name: "Ladakh",
    region: "Ladakh",
    tagline: "Thin air, wide silence, and nowhere to be",
    status: "Under discussion",
    tone: "from-ink via-ink-700 to-pine-600",
  },
  {
    name: "Hampi",
    region: "Karnataka",
    tagline: "Boulders, ruins, and a sunset that takes its time",
    status: "Being scouted",
    tone: "from-clay-500 via-clay-600 to-ink",
  },
  {
    name: "Rishikesh",
    region: "Uttarakhand",
    tagline: "The Ganga, whitewater, and nobody sleeping in",
    status: "Under discussion",
    tone: "from-pine-400 via-pine-500 to-pine-600",
  },
  {
    name: "Kerala backwaters",
    region: "Kerala",
    tagline: "Slow water, and food worth planning a day around",
    status: "Being scouted",
    tone: "from-gold-600 via-clay-400 to-clay-600",
  },
];

/**
 * Enough upcoming cards to bring a grid up to `target` tiles.
 *
 * Callers pass how many real cards they already have; a full grid needs no
 * filler and gets none. `offset` lets a second section on the same page start
 * further down the list instead of repeating the first section's places.
 */
export function fillWithUpcoming(
  realCount: number,
  target: number,
  offset = 0
): UpcomingDestination[] {
  const needed = Math.max(target - realCount, 0);
  if (needed === 0) return [];
  return UPCOMING_DESTINATIONS.slice(offset, offset + needed);
}
