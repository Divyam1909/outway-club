import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DestinationEditorForm } from "@/components/admin/destination-editor-form";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "New destination" };

export default async function NewDestinationPage() {
  // Admin only. The layout lets a `blogger` into /admin for the Journal, so
  // every commercial screen states its own guard rather than inheriting one.
  await requireAdminPage();
  return (
    <div>
      <Link
        href="/admin/destinations"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-pine"
      >
        <ArrowLeft size={15} /> Destinations
      </Link>
      <h1 className="mb-7 font-display text-3xl font-semibold text-ink">New destination</h1>

      <DestinationEditorForm />
    </div>
  );
}
