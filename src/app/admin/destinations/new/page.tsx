import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DestinationEditorForm } from "@/components/admin/destination-editor-form";

export const metadata: Metadata = { title: "New destination" };

export default function NewDestinationPage() {
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
