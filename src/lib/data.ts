import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type {
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

export async function getFeaturedTrips(limit = 6): Promise<Trip[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_COLUMNS)
    .eq("is_published", true)
    .eq("is_featured", true)
    .limit(limit);

  if (error) throw error;
  return (data as Trip[]) ?? [];
}

export async function getAllTrips(filters: TripFilters = {}): Promise<Trip[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let query = supabase.from("trips").select(TRIP_COLUMNS).eq("is_published", true);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.difficulty) query = query.eq("difficulty", filters.difficulty);
  if (filters.tripType) query = query.eq("trip_type", filters.tripType);
  if (filters.maxPrice) query = query.lte("price_per_person", filters.maxPrice);
  if (filters.destinationSlug) {
    const destination = await getDestinationBySlug(filters.destinationSlug);
    if (destination) query = query.eq("destination_id", destination.id);
    else return [];
  }

  switch (filters.sort) {
    case "price_low":
      query = query.order("price_per_person", { ascending: true });
      break;
    case "price_high":
      query = query.order("price_per_person", { ascending: false });
      break;
    case "duration":
      query = query.order("duration_days", { ascending: true });
      break;
    default:
      query = query.order("rating", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Trip[]) ?? [];
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

export type ReviewWithTrip = Review & { trip: Pick<Trip, "title" | "slug"> | null };

/**
 * Approved reviews across every trip, newest first.
 *
 * There is no seeded or synthesised review data anywhere in this project —
 * if this returns an empty array, nobody has travelled and reviewed yet, and
 * the UI says so rather than inventing filler.
 */
export async function getApprovedReviews(limit?: number): Promise<ReviewWithTrip[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  let query = supabase
    .from("reviews")
    .select("*, trip:trips(title, slug)")
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
    .select("*, trip:trips(title, slug)")
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

export async function getTripBySlug(slug: string): Promise<TripWithDetails | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select(
      "*, destination:destinations(*), itinerary_days(*), departures(*), reviews(*)"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const trip = data as unknown as TripWithDetails;

  trip.itinerary_days = [...trip.itinerary_days].sort((a, b) => a.day_number - b.day_number);
  trip.departures = [...trip.departures]
    .filter((d) => d.status !== "closed" && new Date(d.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  trip.reviews = [...trip.reviews]
    .filter((r) => r.is_approved)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return trip;
}
