import type { Metadata } from "next";
import { getAdminStats } from "@/lib/data";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Published trips", value: `${stats.publishedCount} / ${stats.tripCount}` },
    { label: "Destinations", value: stats.destinationCount },
    { label: "Confirmed bookings", value: stats.bookingCount },
    { label: "Revenue collected", value: formatINR(stats.revenue) },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Dashboard</h1>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-white p-6 shadow-soft">
            <p className="text-sm text-ink-500">{card.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
