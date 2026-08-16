import { site } from "@/config/site";
import { nextDeparture } from "@/lib/data";
import type { BlogPost, TripWithDetails } from "@/lib/types";

/**
 * Renders a JSON-LD block. Next.js strips `<script>` children unless they go
 * through dangerouslySetInnerHTML, and the payload is our own serialised
 * object rather than anything user-supplied.
 */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "TravelAgency",
        "@id": `${site.url}/#organization`,
        name: site.name,
        legalName: site.legalName,
        description: site.description,
        url: site.url,
        logo: `${site.url}/brand/logo.png`,
        image: `${site.url}/brand/logo.png`,
        email: site.email,
        ...(site.phoneDisplay ? { telephone: site.phoneDisplay } : {}),
        address: {
          "@type": "PostalAddress",
          addressCountry: "IN",
          addressRegion: "Rajasthan",
          ...(site.address ? { streetAddress: site.address } : {}),
          addressLocality: site.city.split(",")[0]?.trim() || "Udaipur",
        },
        areaServed: { "@type": "Country", name: "India" },
        sameAs: [site.social.instagram, site.social.youtube].filter(Boolean),
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        description: site.description,
        publisher: { "@id": `${site.url}/#organization` },
        inLanguage: "en-IN",
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${site.url}${item.path}`,
        })),
      }}
    />
  );
}

export function FaqJsonLd({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      }}
    />
  );
}

export function BlogPostJsonLd({ post }: { post: BlogPost }) {
  const url = `${site.url}/blog/${post.slug}`;
  const image = post.cover_image
    ? post.cover_image.startsWith("http")
      ? post.cover_image
      : `${site.url}${post.cover_image}`
    : `${site.url}/brand/logo.png`;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `${url}#post`,
        headline: post.title,
        ...(post.subtitle ? { alternativeHeadline: post.subtitle } : {}),
        description: post.seo_description || post.excerpt,
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        image: [image],
        datePublished: post.published_at ?? post.created_at,
        dateModified: post.updated_at,
        author: { "@type": "Person", name: post.author_name },
        publisher: { "@id": `${site.url}/#organization` },
        inLanguage: "en-IN",
        ...(post.tags.length > 0 ? { keywords: post.tags.join(", ") } : {}),
        // Only claim a rating when readers have actually left one.
        ...(post.comment_count > 0 ? { commentCount: post.comment_count } : {}),
      }}
    />
  );
}

export function TripJsonLd({ trip }: { trip: TripWithDetails }) {
  const price = trip.discounted_price ?? trip.price_per_person;
  const absoluteImages = [trip.hero_image, ...trip.gallery]
    .filter(Boolean)
    .map((src) => (src.startsWith("http") ? src : `${site.url}${src}`));

  // `nextDeparture` applies the same filter the booking UI does — drops closed
  // and past dates, then takes the soonest. Reading `trip.departures[0]` raw,
  // as this did until 16 Aug 2026, took whatever order Postgres happened to
  // return: a finished or closed date could end up advertised as an `Event`
  // with `InStock` availability while the page itself said "No upcoming
  // departures right now". Structured data that contradicts the visible page is
  // exactly what Google penalises.
  const departure = nextDeparture(trip);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TouristTrip",
          "@id": `${site.url}/trips/${trip.slug}#trip`,
          name: trip.title,
          description: trip.short_description,
          url: `${site.url}/trips/${trip.slug}`,
          image: absoluteImages,
          provider: { "@id": `${site.url}/#organization` },
          touristType: "Small group travellers",
          itinerary: {
            "@type": "ItemList",
            numberOfItems: trip.itinerary_days.length,
            itemListElement: trip.itinerary_days.map((day) => ({
              "@type": "ListItem",
              position: day.day_number,
              item: {
                "@type": "TouristAttraction",
                name: day.title,
                description: day.description,
              },
            })),
          },
          offers: {
            "@type": "Offer",
            price: String(price),
            priceCurrency: "INR",
            url: `${site.url}/trips/${trip.slug}`,
            availability:
              departure && departure.status !== "sold_out"
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
            ...(departure ? { validFrom: departure.created_at } : {}),
          },
          // Only claim a rating when real, approved reviews exist.
          ...(trip.review_count > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: String(trip.rating),
                  reviewCount: String(trip.review_count),
                  bestRating: "5",
                  worstRating: "1",
                },
                review: trip.reviews.slice(0, 5).map((review) => ({
                  "@type": "Review",
                  author: { "@type": "Person", name: review.author_name },
                  datePublished: review.created_at.slice(0, 10),
                  reviewRating: {
                    "@type": "Rating",
                    ratingValue: String(review.rating),
                    bestRating: "5",
                    worstRating: "1",
                  },
                  ...(review.title ? { name: review.title } : {}),
                  reviewBody: review.body,
                })),
              }
            : {}),
        }}
      />
      {departure && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Event",
            name: trip.title,
            description: trip.short_description,
            startDate: departure.start_date,
            endDate: departure.end_date,
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
            image: absoluteImages.slice(0, 1),
            location: {
              "@type": "Place",
              name: trip.destination.name,
              address: {
                "@type": "PostalAddress",
                addressLocality: trip.destination.name,
                addressRegion: trip.destination.region,
                addressCountry: "IN",
              },
            },
            organizer: { "@id": `${site.url}/#organization` },
            // Same entity as the organizer, and deliberately so: on a guided
            // small-group departure we both arrange the trip and lead it, so
            // there is no third party to credit. Google lists `performer` as
            // recommended for Event, and omitting it was the second of the two
            // warnings Search Console raised on 16 Aug 2026.
            performer: { "@id": `${site.url}/#organization` },
            offers: {
              "@type": "Offer",
              price: String(departure.price_override ?? price),
              priceCurrency: "INR",
              url: `${site.url}/trips/${trip.slug}`,
              availability:
                departure.status === "sold_out"
                  ? "https://schema.org/SoldOut"
                  : "https://schema.org/InStock",
              // When the offer became bookable, which is when the departure row
              // was created. The TouristTrip offer above already carried this;
              // the Event one did not, which was the first warning.
              validFrom: departure.created_at,
            },
          }}
        />
      )}
    </>
  );
}
