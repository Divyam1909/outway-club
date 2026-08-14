export type Category =
  | "adventure"
  | "leisure"
  | "honeymoon"
  | "pilgrimage"
  | "wildlife"
  | "trek"
  | "weekend"
  | "family"
  | "culture";

export type Difficulty = "easy" | "moderate" | "challenging";
export type TripType = "group" | "private" | "customizable";
export type DepartureStatus = "open" | "filling_fast" | "sold_out" | "closed";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "unpaid" | "paid" | "refund_pending" | "refunded" | "failed";

export interface Destination {
  id: string;
  slug: string;
  name: string;
  region: string;
  country: string;
  tagline: string | null;
  description: string | null;
  best_time: string | null;
  hero_image: string;
  gallery: string[];
  is_featured: boolean;
  created_at: string;
}

export interface Meals {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export interface ItineraryDay {
  id: string;
  trip_id: string;
  day_number: number;
  title: string;
  description: string;
  activities: string[];
  meals: Meals;
  accommodation: string | null;
}

export interface Departure {
  id: string;
  trip_id: string;
  start_date: string;
  end_date: string;
  total_seats: number;
  seats_booked: number;
  price_override: number | null;
  status: DepartureStatus;
  created_at: string;
}

export interface Review {
  id: string;
  trip_id: string;
  user_id: string | null;
  booking_id: string | null;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  /** Optional link to a video testimonial (YouTube, Vimeo or a direct file). */
  video_url: string | null;
  trip_month: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface Trip {
  id: string;
  slug: string;
  title: string;
  destination_id: string;
  category: Category;
  trip_type: TripType;
  duration_days: number;
  duration_nights: number;
  difficulty: Difficulty;
  price_per_person: number;
  discounted_price: number | null;
  group_size_min: number;
  group_size_max: number;
  starting_point: string | null;
  short_description: string;
  description: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  things_to_carry: string[];
  hero_image: string;
  gallery: string[];
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_group_trip: boolean;
  is_published: boolean;
  /** The "001" in "Escape 001". Null for trips that aren't numbered editions. */
  edition_number: number | null;
  /**
   * Homepage ordering. Lowest non-null rank with a live departure becomes the
   * hero; the rest fill the "running now" rail. Null = catalogue only.
   */
  spotlight_rank: number | null;
  created_at: string;
  destination?: Destination;
}

export interface TripWithDetails extends Trip {
  destination: Destination;
  itinerary_days: ItineraryDay[];
  departures: Departure[];
  reviews: Review[];
}

export interface TripWithDepartures extends Trip {
  destination: Destination;
  departures: Departure[];
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "customer" | "admin";
  created_at: string;
}

export interface Traveler {
  id: string;
  booking_id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  id_proof_type: string | null;
  id_proof_number: string | null;
  is_primary: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  trip_id: string;
  departure_id: string | null;
  num_travelers: number;
  total_amount: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_refund_id: string | null;
  special_requests: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  refund_amount: number | null;
  created_at: string;
  trip?: Trip;
  departure?: Departure;
  travelers?: Traveler[];
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  trip_id: string | null;
  message: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
  trip?: Pick<Trip, "title" | "slug"> | null;
}

export type TripRequestStatus = "new" | "contacted" | "confirmed" | "closed";

/**
 * A booking request: the two-minute form that replaced checkout while payments
 * are off. Nothing is held and no seat moves until ops confirm it by hand.
 * Answer values are the ones defined in src/config/trip-request.ts.
 */
export interface TripRequest {
  id: string;
  trip_id: string;
  departure_id: string | null;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  num_travelers: number;
  origin_city: string;
  /** Only set when origin_city is "other". */
  origin_city_other: string | null;
  travel_help: string;
  travel_style: string;
  pace: string;
  evenings: string;
  group_type: string;
  social_energy: string;
  age_band: string;
  deal_breakers: string | null;
  notes: string | null;
  status: TripRequestStatus;
  created_at: string;
  trip?: Pick<Trip, "title" | "slug"> | null;
  departure?: Pick<Departure, "start_date" | "end_date"> | null;
}

export interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string;
  created_at: string;
}

export type PostStatus = "draft" | "published";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  /** Sanitised article body. See src/lib/sanitize-html.ts. */
  content_html: string;
  cover_image: string | null;
  cover_caption: string | null;
  author_id: string | null;
  author_name: string;
  author_role: string | null;
  tags: string[];
  destination_id: string | null;
  trip_id: string | null;
  reading_minutes: number;
  status: PostStatus;
  published_at: string | null;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  rating: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  destination?: Pick<Destination, "name" | "slug"> | null;
  trip?: Pick<Trip, "title" | "slug" | "hero_image"> | null;
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string | null;
  author_name: string;
  author_email: string | null;
  /** Null when the reader left a comment without a star rating. */
  rating: number | null;
  body: string;
  is_approved: boolean;
  created_at: string;
}

export type BlogCommentWithPost = BlogComment & {
  post: Pick<BlogPost, "title" | "slug"> | null;
};

export type DurationBucket = "short" | "medium" | "long";
export type TripSort = "soonest" | "popular" | "price_low" | "price_high" | "duration";

export interface TripFilters {
  category?: Category;
  destinationSlug?: string;
  /** Matches destinations.region, so "Himalayas" spans several destinations. */
  region?: string;
  difficulty?: Difficulty;
  tripType?: TripType;
  maxPrice?: number;
  minPrice?: number;
  /** "short" = 2-3 days, "medium" = 4-6, "long" = 7+. */
  duration?: DurationBucket;
  /** ISO month, e.g. "2026-10". Keeps only trips with a departure that month. */
  month?: string;
  sort?: TripSort;
}

/** A single dated departure joined back to the trip it belongs to. */
export interface DepartureWithTrip extends Departure {
  trip: Trip & { destination: Destination };
}
