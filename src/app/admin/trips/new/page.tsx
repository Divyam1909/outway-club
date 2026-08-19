import type { Metadata } from "next";
import { TripEditorForm } from "@/components/admin/trip-editor-form";
import { getAllDestinations } from "@/lib/data";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "New trip" };

export default async function NewTripPage() {
  // Admin only. The layout lets a `blogger` into /admin for the Journal, so
  // every commercial screen states its own guard rather than inheriting one.
  await requireAdminPage();
  const destinations = await getAllDestinations();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">New trip</h1>
      <TripEditorForm destinations={destinations} />
    </div>
  );
}
