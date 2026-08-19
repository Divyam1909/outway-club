import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DestinationEditorForm } from "@/components/admin/destination-editor-form";
import { getDestinationByIdForAdmin, getDestinationsForAdmin } from "@/lib/data";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Edit destination" };

export default async function EditDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Admin only. The layout lets a `blogger` into /admin for the Journal, so
  // every commercial screen states its own guard rather than inheriting one.
  await requireAdminPage();
  const { id } = await params;

  const [destination, all] = await Promise.all([
    getDestinationByIdForAdmin(id),
    getDestinationsForAdmin(),
  ]);

  if (!destination) notFound();

  const tripCount = all.find((entry) => entry.id === id)?.trip_count ?? 0;

  return (
    <div>
      <Link
        href="/admin/destinations"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-pine"
      >
        <ArrowLeft size={15} /> Destinations
      </Link>
      <h1 className="mb-7 font-display text-3xl font-semibold text-ink">{destination.name}</h1>

      <DestinationEditorForm destination={destination} tripCount={tripCount} />
    </div>
  );
}
