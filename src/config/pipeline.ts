/**
 * Escapes we're scouting but haven't committed to.
 *
 * These deliberately live in code rather than the database: they aren't trips.
 * They have no price, no dates, no itinerary and no booking path, and half of
 * them will change or be dropped. Giving them a `trips` row would mean every
 * query on the site had to learn to exclude them.
 *
 * Edit this array when the pipeline changes. An empty array is valid — the
 * section just doesn't render. Deliberately no edition numbers: those get
 * assigned in the admin console when a trip becomes real, and hardcoding
 * "002" here would collide the moment someone numbers an actual escape.
 */

export type PipelineEntry = {
  /** Lucide icon name, resolved in the page. */
  icon: "mountain" | "sailboat" | "tent" | "compass";
  theme: string;
  body: string;
  /** Honest status. "Under discussion" is a fine answer. */
  status: string;
};

export const PIPELINE: PipelineEntry[] = [
  {
    icon: "mountain",
    theme: "A proper Himalayan week",
    body: "Longer, higher, slower. Enough days that acclimatising isn't something we rush, and a route that doesn't turn into eight hours a day in a vehicle.",
    status: "Being scouted for late 2026",
  },
  {
    icon: "sailboat",
    theme: "Coast and backwater",
    body: "The version of a beach trip that isn't just a beach, water you can actually swim in, food worth planning a day around, and no resort buffet anywhere in the itinerary.",
    status: "Winter 2026 to 2027",
  },
  {
    icon: "tent",
    theme: "Something without a road",
    body: "A trek or an overland stretch where the point is that it's hard to reach. Smaller group, more kit, a lot more preparation from us before it goes on sale.",
    status: "Under discussion",
  },
];
