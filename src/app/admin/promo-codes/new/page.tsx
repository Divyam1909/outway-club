import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PromoCodeForm } from "@/components/admin/promo-code-form";
import { requireAdminPage } from "@/lib/auth";
import { getAllTripsForAdmin } from "@/lib/data";

export const metadata: Metadata = { title: "New promo code" };

export default async function NewPromoCodePage() {
  await requireAdminPage();
  const trips = await getAllTripsForAdmin();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/promo-codes" className="btn-ghost mb-5 px-0 text-ink-500">
        <ArrowLeft size={15} /> Promo codes
      </Link>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">New promo code</h1>
      <PromoCodeForm
        trips={trips.map((trip) => ({
          id: trip.id,
          title: trip.title,
          price_per_person: trip.price_per_person,
          discounted_price: trip.discounted_price,
          is_published: trip.is_published,
        }))}
      />
    </div>
  );
}
