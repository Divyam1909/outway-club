import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAllBookingsForAdmin } from "@/lib/data";
import { formatDate, formatDateRange, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "pine" | "clay" | "gold" | "ink"> = {
  confirmed: "pine",
  pending: "gold",
  cancelled: "ink",
  completed: "ink",
};

const PAYMENT_TONE: Record<string, "pine" | "clay" | "gold" | "ink"> = {
  paid: "pine",
  refund_pending: "gold",
  refunded: "clay",
  failed: "clay",
  unpaid: "ink",
};

export default async function AdminBookingsPage() {
  const bookings = await getAllBookingsForAdmin();

  const totalCollected = bookings
    .filter((booking) => booking.payment_status === "paid")
    .reduce((sum, booking) => sum + Number(booking.total_amount), 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Bookings</h1>
          <p className="mt-1 text-sm text-ink-500">
            {bookings.length} total · {formatINR(totalCollected)} collected
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/50 p-12 text-center">
          <p className="font-display text-lg font-semibold text-ink">No bookings yet</p>
          <p className="mt-1 text-sm text-ink-500">
            Every booking will land here with its full traveller list and payment reference.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">All bookings, newest first</caption>
              <thead className="border-b border-border bg-cream-300/50 text-left text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Ref</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Booked</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Trip &amp; dates</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Pax</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Amount</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Payment</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-cream-300/30">
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs uppercase text-ink-500">
                      {booking.id.slice(0, 8)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-ink-500">
                      {formatDate(booking.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="block font-medium text-ink">{booking.trip?.title ?? "—"}</span>
                      {booking.departure && (
                        <span className="block text-xs text-ink-400">
                          {formatDateRange(booking.departure.start_date, booking.departure.end_date)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-ink-500">{booking.num_travelers}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-ink">
                      {formatINR(booking.total_amount)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={PAYMENT_TONE[booking.payment_status] ?? "ink"} className="whitespace-nowrap">
                        {booking.payment_status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={STATUS_TONE[booking.status] ?? "ink"} className="capitalize">
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-pine hover:underline"
                      >
                        Open <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className="block rounded-2xl border border-border bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{booking.trip?.title ?? "—"}</p>
                      <p className="mt-0.5 font-mono text-xs uppercase text-ink-400">
                        {booking.id.slice(0, 8)} · {formatDate(booking.created_at)}
                      </p>
                    </div>
                    <span className="shrink-0 font-display text-base font-semibold text-ink">
                      {formatINR(booking.total_amount)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS_TONE[booking.status] ?? "ink"} className="capitalize">
                      {booking.status}
                    </Badge>
                    <Badge tone={PAYMENT_TONE[booking.payment_status] ?? "ink"}>
                      {booking.payment_status.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-ink-400">{booking.num_travelers} pax</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
