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

export interface TripFilters {
  category?: Category;
  destinationSlug?: string;
  difficulty?: Difficulty;
  tripType?: TripType;
  maxPrice?: number;
  sort?: "popular" | "price_low" | "price_high" | "duration";
}
