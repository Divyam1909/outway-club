import type { Metadata } from "next";
import Link from "next/link";
import { MapPinned, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";
import { DeleteDestinationButton } from "@/components/admin/delete-destination-button";
import { getDestinationsForAdmin } from "@/lib/data";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Manage destinations" };

export default async function AdminDestinationsPage() {
  // Admin only. The layout lets a `blogger` into /admin for the Journal, so
  // every commercial screen states its own guard rather than inheriting one.
  await requireAdminPage();
  const destinations = await getDestinationsForAdmin();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Destinations</h1>
          <p className="mt-1 text-sm text-ink-500">
            The places trips go to. Every trip has to point at one of these.
          </p>
        </div>
        <Link href="/admin/destinations/new" className="btn-primary">
          <Plus size={16} /> New destination
        </Link>
      </div>

      {destinations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clay-50 text-clay">
            <MapPinned size={22} />
          </span>
          <h2 className="heading-sm text-xl text-ink">No destinations yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            Add a place before you add a trip to it, a trip can&apos;t be saved without one.
          </p>
          <Link href="/admin/destinations/new" className="btn-accent mt-6">
            <Plus size={16} /> Add the first destination
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {destinations.map((destination) => (
            <li
              key={destination.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white"
            >
              <div className="relative aspect-[16/9] bg-cream-300">
                <SmartImage
                  src={destination.hero_image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  fallbackLabel={destination.name}
                />
                {destination.is_featured && (
                  <span className="absolute left-3 top-3">
                    <Badge tone="gold">Featured</Badge>
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h2 className="heading-sm text-lg text-ink">{destination.name}</h2>
                <p className="mt-0.5 text-xs text-ink-500">
                  {destination.region}, {destination.country} · /{destination.slug}
                </p>

                {destination.tagline && (
                  <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-ink-500">
                    {destination.tagline}
                  </p>
                )}

                <p className="mt-3 text-xs text-ink-500">
                  {destination.trip_count === 0
                    ? "No trips yet"
                    : `${destination.trip_count} trip${destination.trip_count === 1 ? "" : "s"} · ${destination.published_trip_count} published`}
                  {destination.gallery.length > 0 && ` · ${destination.gallery.length} gallery photos`}
                </p>

                <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/admin/destinations/${destination.id}/edit`}
                      className="text-sm font-medium text-pine hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/destinations/${destination.slug}`}
                      target="_blank"
                      className="text-sm font-medium text-ink-500 hover:text-pine"
                    >
                      View
                    </Link>
                  </div>
                  <DeleteDestinationButton
                    destinationId={destination.id}
                    name={destination.name}
                    tripCount={destination.trip_count}
                    slug={destination.slug}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
