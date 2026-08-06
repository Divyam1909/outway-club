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

export async function getGroupTrips(): Promise<TripWithDepartures[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*, destination:destinations(*), departures(*)")
    .eq("is_published", true)
    .eq("is_group_trip", true)
    .order("rating", { ascending: false });

  if (error) throw error;

  const trips = (data as unknown as TripWithDepartures[]) ?? [];
  return trips.map((trip) => ({
    ...trip,
    departures: [...(trip.departures ?? [])]
      .filter((d) => d.status !== "closed" && new Date(d.start_date) >= new Date())
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()),
  }));
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

export async function getAdminStats() {
  if (!isSupabaseConfigured()) {
    return { tripCount: 0, publishedCount: 0, destinationCount: 0, bookingCount: 0, revenue: 0 };
  }
  const supabase = await createClient();

  const [{ count: tripCount }, { count: publishedCount }, { data: bookings }, { count: destinationCount }] =
    await Promise.all([
      supabase.from("trips").select("*", { count: "exact", head: true }),
      supabase.from("trips").select("*", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("bookings").select("total_amount, payment_status, status"),
      supabase.from("destinations").select("*", { count: "exact", head: true }),
    ]);

  const confirmedBookings = (bookings ?? []).filter((b) => b.status !== "cancelled");
  const revenue = (bookings ?? [])
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  return {
    tripCount: tripCount ?? 0,
    publishedCount: publishedCount ?? 0,
    destinationCount: destinationCount ?? 0,
    bookingCount: confirmedBookings.length,
    revenue,
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

export async function getFeaturedReviews(limit = 6): Promise<(Review & { trip: Pick<Trip, "title" | "slug"> })[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, trip:trips(title, slug)")
    .eq("is_approved", true)
    .eq("rating", 5)
    .limit(limit);

  if (error) throw error;
  return (data as unknown as (Review & { trip: Pick<Trip, "title" | "slug"> })[]) ?? [];
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
