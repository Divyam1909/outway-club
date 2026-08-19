import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PromoCodeForm } from "@/components/admin/promo-code-form";
import { requireAdminPage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllTripsForAdmin } from "@/lib/data";
import type { PromoCode } from "@/lib/types";

export const metadata: Metadata = { title: "Edit promo code" };

export default async function EditPromoCodePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;

  const [{ data }, trips] = await Promise.all([
    createAdminClient().from("promo_codes").select("*").eq("id", id).maybeSingle(),
    getAllTripsForAdmin(),
  ]);

  if (!data) notFound();
  const promo = data as PromoCode;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/promo-codes" className="btn-ghost mb-5 px-0 text-ink-500">
        <ArrowLeft size={15} /> Promo codes
      </Link>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">
        Edit <span className="font-mono uppercase">{promo.code}</span>
      </h1>
      <PromoCodeForm
        promo={promo}
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
