import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type {
  Departure,
  DepartureWithTrip,
  Destination,
  Trip,
  TripFilters,
  TripWithDetails,
  TripWithDepartures,
  Review,
  Booking,
  Profile,
  Enquiry,
  Subscriber,
} from "@/lib/types";

const TRIP_COLUMNS = "*, destination:destinations(*)";
const DETAIL_COLUMNS =
  "*, destination:destinations(*), itinerary_days(*), departures(*), reviews(*)";

// Every function below bails out to an empty/null fallback when Supabase
// isn't configured yet, instead of throwing. The root layout's setup guard
// (src/components/setup-required.tsx) is the actual UI shown in that state —
// this just keeps route segments from erroring while that guard decides not
// to render them (Next.js still evaluates matched page segments eagerly).

export async function getFeaturedDestinations(): Promise<Destination[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .eq("is_featured", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export type DestinationWithAvailability = Destination & { tripCount: number };

/**
 * Every destination with a count of published trips against it, so the
 * homepage explorer can tell "we run trips here" apart from "planned, not
 * launched yet" without a second round trip per card.
 */
export async function getDestinationsWithAvailability(): Promise<DestinationWithAvailability[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const [{ data: destinations, error }, { data: trips }] = await Promise.all([
    supabase.from("destinations").select("*").order("is_featured", { ascending: false }).order("name"),
    supabase.from("trips").select("destination_id").eq("is_published", true),
  ]);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const trip of trips ?? []) {
    counts.set(trip.destination_id, (counts.get(trip.destination_id) ?? 0) + 1);
  }

  return ((destinations as Destination[]) ?? []).map((destination) => ({
    ...destination,
    tripCount: counts.get(destination.id) ?? 0,
  }));
}

export async function getAllDestinations(): Promise<Destination[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("destinations").select("*").order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getTripsByDestination(destinationId: string): Promise<Trip[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_COLUMNS)
    .eq("destination_id", destinationId)
    .eq("is_published", true)
    .order("is_featured", { ascending: false });

  if (error) throw error;
  return (data as Trip[]) ?? [];
}

// ---------------------------------------------------------------------------
// Departures
//
// A trip has many dated departures. "Live" means still open and not in the
// past — everything user-facing counts seats and dates off this set, never off
// the raw column, so a sold-out or expired date can't leak into the catalogue.
// ---------------------------------------------------------------------------

/** Midnight today, so a departure leaving later *today* still counts as live. */
function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function liveDepartures(departures: Departure[]): Departure[] {
  const today = startOfToday();
  return [...departures]
    .filter((d) => d.status !== "closed" && new Date(d.start_date) >= today)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
}

/** The soonest bookable date for a trip, or null if it has none. */
export function nextDeparture(trip: { departures: Departure[] }): Departure | null {
  return liveDepartures(trip.departures)[0] ?? null;
}

const DURATION_BUCKETS: Record<string, (days: number) => boolean> = {
  short: (days) => days <= 3,
  medium: (days) => days >= 4 && days <= 6,
  long: (days) => days >= 7,
};

/**
 * The catalogue query behind /trips.
 *
 * Column predicates (category, price, difficulty) run in Postgres. Anything
 * that depends on the departures array — month, sort-by-soonest — runs here in
 * JS, because expressing "trips having a departure in October, ordered by that
 * departure" in PostgREST needs an embedded filter plus a second pass anyway.
 * At this catalogue's size the whole published set is a few dozen rows; if it
 * ever reaches thousands this wants to become a database view.
 */
export async function getCatalogueTrips(
  filters: TripFilters = {}
): Promise<TripWithDepartures[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  let query = supabase
    .from("trips")
    .select("*, destination:destinations(*), departures(*)")
    .eq("is_published", true);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.difficulty) query = query.eq("difficulty", filters.difficulty);
  if (filters.tripType) query = query.eq("trip_type", filters.tripType);
  if (filters.maxPrice) query = query.lte("price_per_person", filters.maxPrice);
  if (filters.minPrice) query = query.gte("price_per_person", filters.minPrice);
  if (filters.destinationSlug) {
    const destination = await getDestinationBySlug(filters.destinationSlug);
    if (!destination) return [];
    query = query.eq("destination_id", destination.id);
  }

  const { data, error } = await query;
  if (error) throw error;

  let trips = ((data as unknown as TripWithDepartures[]) ?? []).map((trip) => ({
    ...trip,
    departures: liveDepartures(trip.departures),
  }));

  if (filters.region) {
    trips = trips.filter((trip) => trip.destination?.region === filters.region);
  }

  if (filters.duration) {
    const matches = DURATION_BUCKETS[filters.duration];
    if (matches) trips = trips.filter((trip) => matches(trip.duration_days));
  }

  if (filters.month) {
    trips = trips.filter((trip) =>
      trip.departures.some((d) => d.start_date.startsWith(filters.month!))
    );
  }

  return sortTrips(trips, filters.sort);
}

function sortTrips(trips: TripWithDepartures[], sort: TripFilters["sort"]) {
  const price = (t: Trip) => t.discounted_price ?? t.price_per_person;

  switch (sort) {
    case "price_low":
      return trips.sort((a, b) => price(a) - price(b));
    case "price_high":
      return trips.sort((a, b) => price(b) - price(a));
    case "duration":
      return trips.sort((a, b) => a.duration_days - b.duration_days);
    case "popular":
      return trips.sort((a, b) => b.rating - a.rating || b.review_count - a.review_count);
    default:
      // "soonest" — trips you can actually book next come first, and anything
      // without a live departure sinks to the bottom rather than disappearing.
      return trips.sort((a, b) => {
        const aNext = a.departures[0]?.start_date;
        const bNext = b.departures[0]?.start_date;
        if (!aNext && !bNext) return 0;
        if (!aNext) return 1;
        if (!bNext) return -1;
        return aNext.localeCompare(bNext);
      });
  }
}

/**
 * The homepage headline act. Lowest spotlight_rank among published trips that
 * still have a bookable date; falls back to whichever trip departs soonest, so
 * the hero is never empty while something is on sale. Replaces the old
 * hardcoded LAUNCH_TRIP_SLUG constant.
 */
export async function getCurrentEscape(): Promise<TripWithDetails | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trips")
    .select(DETAIL_COLUMNS)
    .eq("is_published", true);

  if (error) throw error;

  const bookable = ((data as unknown as TripWithDetails[]) ?? [])
    .map(hydrateTripDetails)
    .filter((trip) => trip.departures.length > 0);

  if (bookable.length === 0) return null;

  const ranked = bookable
    .filter((trip) => trip.spotlight_rank !== null)
    .sort((a, b) => a.spotlight_rank! - b.spotlight_rank!);

  if (ranked.length > 0) return ranked[0];

  return bookable.sort((a, b) =>
    a.departures[0].start_date.localeCompare(b.departures[0].start_date)
  )[0];
}

/**
 * Everything else on sale, for the "also running" rail under the hero.
 * `excludeId` keeps the spotlight trip from appearing twice on one page.
 */
export async function getRunningTrips(
  { excludeId, limit = 6 }: { excludeId?: string; limit?: number } = {}
): Promise<TripWithDepartures[]> {
  const trips = await getCatalogueTrips({ sort: "soonest" });
  return trips
    .filter((trip) => trip.departures.length > 0 && trip.id !== excludeId)
    .slice(0, limit);
}

/**
 * A flat, chronological departure board across every trip — the "what can I
 * book in the next few months" view. One trip running four dates yields four
 * rows here, which is the whole point.
 */
export async function getUpcomingDepartures(limit = 8): Promise<DepartureWithTrip[]> {
  const trips = await getCatalogueTrips();

  return trips
    .flatMap((trip) =>
      trip.departures.map((departure) => ({
        ...departure,
        trip: { ...trip, destination: trip.destination },
      }))
    )
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, limit) as DepartureWithTrip[];
}

/**
 * The filter options actually worth showing. Derived from live data rather
 * than a hardcoded list, so a filter can never offer a month or a region that
 * returns nothing.
 */
export async function getCatalogueFacets(): Promise<{
  regions: string[];
  categories: string[];
  months: { value: string; label: string }[];
  maxPrice: number;
}> {
  const trips = await getCatalogueTrips();

  const regions = [...new Set(trips.map((t) => t.destination?.region).filter(Boolean))].sort();
  const categories = [...new Set(trips.map((t) => t.category))].sort();

  const months = [
    ...new Set(trips.flatMap((t) => t.departures.map((d) => d.start_date.slice(0, 7)))),
  ]
    .sort()
    .map((value) => ({
      value,
      label: new Date(`${value}-01T00:00:00`).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }),
    }));

  const maxPrice = trips.reduce(
    (max, t) => Math.max(max, t.discounted_price ?? t.price_per_person),
    0
  );

  return { regions: regions as string[], categories, months, maxPrice };
}

export async function getBookingById(id: string): Promise<Booking | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, trip:trips(*), departure:departures(*), travelers(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as Booking | null;
}

export async function getMyBookings(userId: string): Promise<Booking[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, trip:trips(*), departure:departures(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as Booking[]) ?? [];
}

export async function getAllTripsForAdmin(): Promise<Trip[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Trip[]) ?? [];
}

export type DestinationWithUsage = Destination & {
  trip_count: number;
  published_trip_count: number;
};

/**
 * Destinations with the number of trips pointing at each.
 *
 * The count matters operationally: trips.destination_id is ON DELETE RESTRICT,
 * so a destination with trips attached cannot be removed — the admin list
 * says so up front rather than letting someone hit a database error.
 */
export async function getDestinationsForAdmin(): Promise<DestinationWithUsage[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const [{ data: destinations, error }, { data: trips }] = await Promise.all([
    supabase.from("destinations").select("*").order("name"),
    supabase.from("trips").select("destination_id, is_published"),
  ]);

  if (error) throw error;

  const counts = new Map<string, { total: number; published: number }>();
  for (const trip of trips ?? []) {
    const entry = counts.get(trip.destination_id) ?? { total: 0, published: 0 };
    entry.total += 1;
    if (trip.is_published) entry.published += 1;
    counts.set(trip.destination_id, entry);
  }

  return ((destinations as Destination[]) ?? []).map((destination) => ({
    ...destination,
    trip_count: counts.get(destination.id)?.total ?? 0,
    published_trip_count: counts.get(destination.id)?.published ?? 0,
  }));
}

export async function getDestinationByIdForAdmin(id: string): Promise<Destination | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Destination | null;
}

export async function getAllBookingsForAdmin(): Promise<Booking[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, trip:trips(*), departure:departures(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as Booking[]) ?? [];
}

const EMPTY_ADMIN_STATS = {
  tripCount: 0,
  publishedCount: 0,
  bookingCount: 0,
  travellerCount: 0,
  revenue: 0,
  refunded: 0,
  cancelledCount: 0,
  customerCount: 0,
  newEnquiryCount: 0,
  pendingReviewCount: 0,
  subscriberCount: 0,
  seatsSold: 0,
  seatsTotal: 0,
  destinationCount: 0,
  postCount: 0,
  publishedPostCount: 0,
  pendingCommentCount: 0,
};

export type AdminStats = typeof EMPTY_ADMIN_STATS;

export async function getAdminStats(): Promise<AdminStats> {
  if (!isSupabaseConfigured()) return EMPTY_ADMIN_STATS;
  const supabase = await createClient();

  const [
    { count: tripCount },
    { count: publishedCount },
    { data: bookings },
    { count: customerCount },
    { count: newEnquiryCount },
    { count: pendingReviewCount },
    { count: subscriberCount },
    { data: departures },
    { count: destinationCount },
    { count: postCount },
    { count: publishedPostCount },
    { count: pendingCommentCount },
  ] = await Promise.all([
    supabase.from("trips").select("*", { count: "exact", head: true }),
    supabase.from("trips").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("bookings").select("total_amount, refund_amount, payment_status, status, num_travelers"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
    supabase.from("departures").select("total_seats, seats_booked"),
    supabase.from("destinations").select("*", { count: "exact", head: true }),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("blog_comments").select("*", { count: "exact", head: true }).eq("is_approved", false),
  ]);

  const rows = bookings ?? [];
  const live = rows.filter((booking) => booking.status !== "cancelled");

  return {
    tripCount: tripCount ?? 0,
    publishedCount: publishedCount ?? 0,
    bookingCount: live.length,
    travellerCount: live.reduce((sum, booking) => sum + Number(booking.num_travelers ?? 0), 0),
    revenue: rows
      .filter((booking) => booking.payment_status === "paid")
      .reduce((sum, booking) => sum + Number(booking.total_amount), 0),
    refunded: rows.reduce((sum, booking) => sum + Number(booking.refund_amount ?? 0), 0),
    cancelledCount: rows.filter((booking) => booking.status === "cancelled").length,
    customerCount: customerCount ?? 0,
    newEnquiryCount: newEnquiryCount ?? 0,
    pendingReviewCount: pendingReviewCount ?? 0,
    subscriberCount: subscriberCount ?? 0,
    seatsSold: (departures ?? []).reduce((sum, d) => sum + Number(d.seats_booked ?? 0), 0),
    seatsTotal: (departures ?? []).reduce((sum, d) => sum + Number(d.total_seats ?? 0), 0),
    destinationCount: destinationCount ?? 0,
    postCount: postCount ?? 0,
    publishedPostCount: publishedPostCount ?? 0,
    pendingCommentCount: pendingCommentCount ?? 0,
  };
}

export async function getTripByIdForAdmin(id: string): Promise<TripWithDetails | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*, destination:destinations(*), itinerary_days(*), departures(*), reviews(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const trip = data as unknown as TripWithDetails;
  trip.itinerary_days = [...trip.itinerary_days].sort((a, b) => a.day_number - b.day_number);
  trip.departures = [...trip.departures].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  return trip;
}

export type ReviewWithTrip = Review & {
  trip: (Pick<Trip, "title" | "slug"> & { destination: Pick<Destination, "name" | "slug"> | null }) | null;
};

/**
 * Approved reviews across every trip, newest first, with just enough of the
 * trip and destination attached that the reviews page can group by place
 * without a second round trip per review.
 *
 * There is no seeded or synthesised review data anywhere in this project:
 * if this returns an empty array, nobody has travelled and reviewed yet, and
 * the UI says so rather than inventing filler.
 */
export async function getApprovedReviews(limit?: number): Promise<ReviewWithTrip[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  let query = supabase
    .from("reviews")
    .select("*, trip:trips(title, slug, destination:destinations(name, slug))")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as ReviewWithTrip[]) ?? [];
}

/** Highest-rated approved reviews, for the homepage strip. */
export async function getFeaturedReviews(limit = 3): Promise<ReviewWithTrip[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, trip:trips(title, slug, destination:destinations(name, slug))")
    .eq("is_approved", true)
    .gte("rating", 4)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as unknown as ReviewWithTrip[]) ?? [];
}

// ---------------------------------------------------------------------------
// Admin console queries
// ---------------------------------------------------------------------------

export async function getPendingReviewsForAdmin(): Promise<ReviewWithTrip[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, trip:trips(title, slug)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as ReviewWithTrip[]) ?? [];
}

export async function getBookingByIdForAdmin(id: string): Promise<Booking | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, trip:trips(*), departure:departures(*), travelers(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as Booking | null;
}

export async function getProfilesForAdmin(): Promise<(Profile & { booking_count: number })[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const [{ data: profiles, error }, { data: bookings }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("bookings").select("user_id, status"),
  ]);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const booking of bookings ?? []) {
    if (booking.status === "cancelled") continue;
    counts.set(booking.user_id, (counts.get(booking.user_id) ?? 0) + 1);
  }

  return ((profiles as Profile[]) ?? []).map((profile) => ({
    ...profile,
    booking_count: counts.get(profile.id) ?? 0,
  }));
}

export async function getEnquiriesForAdmin(): Promise<Enquiry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("*, trip:trips(title, slug)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as Enquiry[]) ?? [];
}

export async function getSubscribersForAdmin(): Promise<Subscriber[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Subscriber[]) ?? [];
}

/**
 * Puts a raw trip row into the shape the UI expects: itinerary in day order,
 * only bookable departures, only approved reviews newest-first.
 */
function hydrateTripDetails(trip: TripWithDetails): TripWithDetails {
  return {
    ...trip,
    itinerary_days: [...trip.itinerary_days].sort((a, b) => a.day_number - b.day_number),
    departures: liveDepartures(trip.departures),
    reviews: [...trip.reviews]
      .filter((r) => r.is_approved)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  };
}

export async function getTripBySlug(slug: string): Promise<TripWithDetails | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select(DETAIL_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return hydrateTripDetails(data as unknown as TripWithDetails);
}
