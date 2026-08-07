import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageSquare, Star } from "lucide-react";
import { getAdminStats, getAllBookingsForAdmin } from "@/lib/data";
import { formatDate, formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, bookings] = await Promise.all([getAdminStats(), getAllBookingsForAdmin()]);
  const recent = bookings.slice(0, 6);

  const seatFill = stats.seatsTotal > 0 ? Math.round((stats.seatsSold / stats.seatsTotal) * 100) : 0;

  const cards = [
    { label: "Revenue collected", value: formatINR(stats.revenue), hint: `${formatINR(stats.refunded)} refunded` },
    { label: "Live bookings", value: stats.bookingCount, hint: `${stats.cancelledCount} cancelled` },
    { label: "Travellers booked", value: stats.travellerCount, hint: `${stats.seatsSold} of ${stats.seatsTotal} seats · ${seatFill}%` },
    { label: "Registered accounts", value: stats.customerCount, hint: `${stats.subscriberCount} on the waitlist` },
  ];

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Dashboard</h1>
      <p className="mb-7 text-sm text-ink-500">
        {stats.publishedCount} of {stats.tripCount} trips published.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-white p-6 shadow-soft">
            <p className="text-sm text-ink-500">{card.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">{card.value}</p>
            <p className="mt-1 text-xs text-ink-400">{card.hint}</p>
          </div>
        ))}
      </div>

      {(stats.newEnquiryCount > 0 || stats.pendingReviewCount > 0) && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stats.newEnquiryCount > 0 && (
            <ActionCard
              icon={<MessageSquare size={18} />}
              href="/admin/enquiries"
              title={`${stats.newEnquiryCount} enquir${stats.newEnquiryCount === 1 ? "y" : "ies"} waiting`}
              body="Someone is waiting on a reply."
            />
          )}
          {stats.pendingReviewCount > 0 && (
            <ActionCard
              icon={<Star size={18} />}
              href="/admin/reviews"
              title={`${stats.pendingReviewCount} review${stats.pendingReviewCount === 1 ? "" : "s"} to moderate`}
              body="Hidden from the site until approved."
            />
          )}
        </div>
      )}

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Latest bookings</h2>
          <Link href="/admin/bookings" className="text-sm font-medium text-pine hover:underline">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white/50 p-10 text-center">
            <p className="font-display text-lg font-semibold text-ink">No bookings yet</p>
            <p className="mt-1 text-sm text-ink-500">
              They&apos;ll appear here the moment the first payment clears.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
            {recent.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-cream-300/40"
                >
                  <span className="font-mono text-xs uppercase text-ink-400">
                    {booking.id.slice(0, 8)}
                  </span>
                  <span className="flex-1 text-sm font-medium text-ink">
                    {booking.trip?.title ?? "—"}
                  </span>
                  <span className="text-xs text-ink-400">{formatDate(booking.created_at)}</span>
                  <Badge
                    tone={booking.status === "cancelled" ? "ink" : "pine"}
                    className="capitalize"
                  >
                    {booking.status}
                  </Badge>
                  <span className="w-24 text-right text-sm font-semibold text-ink">
                    {formatINR(booking.total_amount)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  href,
  title,
  body,
}: {
  icon: React.ReactNode;
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-clay-100 bg-clay-50 p-5 transition-colors hover:border-clay"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay text-cream-100">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-clay-700">{title}</span>
        <span className="block text-sm text-clay-600/80">{body}</span>
      </span>
      <ArrowRight size={18} className="text-clay transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
