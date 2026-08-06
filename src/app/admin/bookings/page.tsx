import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { getAllBookingsForAdmin } from "@/lib/data";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Bookings" };

const STATUS_TONE: Record<string, "pine" | "clay" | "gold" | "ink"> = {
  confirmed: "pine",
  pending: "gold",
  cancelled: "ink",
  completed: "ink",
};

export default async function AdminBookingsPage() {
  const bookings = await getAllBookingsForAdmin();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Bookings</h1>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-cream-300/50 text-left text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-5 py-3">Booked on</th>
              <th className="px-5 py-3">Trip</th>
              <th className="px-5 py-3">Travelers</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap px-5 py-4 text-ink-500">{formatDate(booking.created_at)}</td>
                <td className="px-5 py-4 font-medium text-ink">{booking.trip?.title ?? "—"}</td>
                <td className="px-5 py-4 text-ink-500">{booking.num_travelers}</td>
                <td className="px-5 py-4 text-ink-500">{formatINR(booking.total_amount)}</td>
                <td className="px-5 py-4">
                  <Badge tone={booking.payment_status === "paid" ? "pine" : "ink"} className="capitalize">
                    {booking.payment_status}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <Badge tone={STATUS_TONE[booking.status] ?? "ink"} className="capitalize">
                    {booking.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && <p className="p-8 text-center text-ink-400">No bookings yet.</p>}
      </div>
    </div>
  );
}
