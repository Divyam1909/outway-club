import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnquiryStatus } from "@/components/admin/enquiry-status";
import { getEnquiriesForAdmin } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Enquiries" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "pine" | "clay" | "gold" | "ink"> = {
  new: "clay",
  contacted: "gold",
  closed: "ink",
};

export default async function AdminEnquiriesPage() {
  // Admin only. The layout lets a `blogger` into /admin for the Journal, so
  // every commercial screen states its own guard rather than inheriting one.
  await requireAdminPage();
  const enquiries = await getEnquiriesForAdmin();
  const newCount = enquiries.filter((enquiry) => enquiry.status === "new").length;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Enquiries</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        {enquiries.length} total · {newCount} waiting on a reply
      </p>

      {enquiries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/50 p-12 text-center">
          <p className="heading-sm text-lg text-ink">No enquiries yet</p>
          <p className="mt-1 text-sm text-ink-500">
            Messages from the contact form land here, and a copy goes to your inbox.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {enquiries.map((enquiry) => (
            <li key={enquiry.id} className="rounded-2xl border border-border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{enquiry.name}</p>
                    <Badge tone={STATUS_TONE[enquiry.status] ?? "ink"} className="capitalize">
                      {enquiry.status}
                    </Badge>
                    {enquiry.trip && (
                      <span className="text-xs text-ink-500">re: {enquiry.trip.title}</span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <a
                      href={`mailto:${enquiry.email}?subject=${encodeURIComponent("Re: your enquiry, Outway Club")}`}
                      className="flex items-center gap-1.5 text-pine hover:underline"
                    >
                      <Mail size={13} /> {enquiry.email}
                    </a>
                    {enquiry.phone && (
                      <a
                        href={`tel:${enquiry.phone}`}
                        className="flex items-center gap-1.5 text-ink-500 hover:text-pine"
                      >
                        <Phone size={13} /> {enquiry.phone}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-ink-500">{formatDate(enquiry.created_at)}</span>
                  <EnquiryStatus enquiryId={enquiry.id} status={enquiry.status} />
                </div>
              </div>

              <p className="mt-4 whitespace-pre-line rounded-xl bg-cream-300 p-4 text-sm leading-relaxed text-ink-700">
                {enquiry.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
