import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TripEditorForm } from "@/components/admin/trip-editor-form";
import { getAllDestinations, getTripByIdForAdmin } from "@/lib/data";

export const metadata: Metadata = { title: "Edit trip" };

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trip, destinations] = await Promise.all([getTripByIdForAdmin(id), getAllDestinations()]);

  if (!trip) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Edit trip</h1>
      <TripEditorForm destinations={destinations} initialTrip={trip} />
    </div>
  );
}
