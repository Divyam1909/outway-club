import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteTripButton } from "@/components/admin/delete-trip-button";
import { getAllTripsForAdmin } from "@/lib/data";
import { formatINR } from "@/lib/utils";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Manage trips" };

export default async function AdminTripsPage() {
  // Admin only. The layout lets a `blogger` into /admin for the Journal, so
  // every commercial screen states its own guard rather than inheriting one.
  await requireAdminPage();
  const trips = await getAllTripsForAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Trips</h1>
        <Link href="/admin/trips/new" className="btn-primary">
          <Plus size={16} /> New trip
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-cream-300 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3">Trip</th>
              <th className="px-5 py-3">Destination</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.id} className="border-b border-border last:border-0">
                <td className="px-5 py-4 font-medium text-ink">{trip.title}</td>
                <td className="px-5 py-4 text-ink-500">{trip.destination?.name}</td>
                <td className="px-5 py-4 text-ink-500">{formatINR(trip.discounted_price ?? trip.price_per_person)}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <Badge tone={trip.is_published ? "pine" : "ink"}>{trip.is_published ? "Published" : "Draft"}</Badge>
                    {trip.is_featured && <Badge tone="gold">Featured</Badge>}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-4">
                    <Link href={`/admin/trips/${trip.id}/edit`} className="text-sm font-medium text-pine hover:underline">
                      Edit
                    </Link>
                    <DeleteTripButton tripId={trip.id} tripTitle={trip.title} tripSlug={trip.slug} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {trips.length === 0 && <p className="p-8 text-center text-ink-500">No trips yet.</p>}
      </div>
    </div>
  );
}
