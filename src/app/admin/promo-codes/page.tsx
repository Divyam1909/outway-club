import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Sparkles, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PromoToggle } from "@/components/admin/promo-toggle";
import { requireAdminPage } from "@/lib/auth";
import { getPromoCodesForAdmin } from "@/lib/promo";
import { promoStatus, promoValueLabel } from "@/lib/promo-rules";
import { getAllTripsForAdmin } from "@/lib/data";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Promo codes" };

export default async function AdminPromoCodesPage() {
  // Admins only. The blogger role reaches /admin for the Journal, and a
  // discount code is exactly the kind of thing that role must not touch.
  await requireAdminPage();

  const [codes, trips] = await Promise.all([getPromoCodesForAdmin(), getAllTripsForAdmin()]);
  const tripTitles = new Map(trips.map((trip) => [trip.id, trip.title]));

  const totalClaimed = codes.reduce((sum, code) => sum + code.redemption_count, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Promo codes</h1>
          <p className="mt-1 text-sm text-ink-500">
            {codes.length} code{codes.length === 1 ? "" : "s"} · claimed {totalClaimed} time
            {totalClaimed === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/admin/promo-codes/new" className="btn-primary">
          <Plus size={16} /> New code
        </Link>
      </div>

      {codes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clay-50 text-clay">
            <Tag size={22} />
          </span>
          <h2 className="heading-sm text-xl text-ink">No codes yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
            A code can belong to a collaborator, with a usage cap and their name against it, or it
            can be an event offer that applies itself at checkout and stops when its window closes.
            Either way, only one code is ever applied to a booking.
          </p>
          <Link href="/admin/promo-codes/new" className="btn-accent mt-6">
            <Plus size={16} /> Create the first one
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <ul className="divide-y divide-border">
            {codes.map((code) => {
              const status = promoStatus(code);
              const scope =
                code.trip_ids.length === 0
                  ? "Every escape"
                  : code.trip_ids.map((id) => tripTitles.get(id) ?? "a removed trip").join(", ");

              return (
                <li key={code.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold uppercase tracking-wider text-ink">
                          {code.code}
                        </span>
                        <Badge tone={status.tone}>{status.label}</Badge>
                        {code.auto_apply && (
                          <Badge tone="gold">
                            <Sparkles size={11} className="mr-1 inline" aria-hidden="true" />
                            Auto-applies
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm font-medium text-ink-700">
                        {code.label} · {promoValueLabel(code)}
                        {code.max_discount_amount
                          ? `, capped at ${formatINR(Number(code.max_discount_amount))}`
                          : ""}
                      </p>

                      <p className="mt-1 text-xs leading-relaxed text-ink-500">
                        {scope}
                        {" · "}
                        {code.usage_limit === null
                          ? `${code.times_used} used, no cap`
                          : `${code.times_used} of ${code.usage_limit} used`}
                        {code.per_user_limit !== null ? ` · ${code.per_user_limit} per person` : ""}
                        {Number(code.min_order_amount) > 0
                          ? ` · min ${formatINR(Number(code.min_order_amount))}`
                          : ""}
                      </p>

                      <p className="mt-1 text-xs text-ink-500">
                        {code.starts_at
                          ? `From ${formatDate(code.starts_at)}`
                          : "Live from creation"}
                        {code.ends_at ? ` until ${formatDate(code.ends_at)}` : " · no end date"}
                        {code.partner_name ? ` · ${code.partner_name}` : ""}
                        {code.partner_handle ? ` (${code.partner_handle})` : ""}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href={`/admin/promo-codes/${code.id}/edit`}
                        className="text-sm font-medium text-pine hover:underline"
                      >
                        Edit
                      </Link>
                      <PromoToggle
                        promoId={code.id}
                        code={code.code}
                        isActive={code.is_active}
                        redemptionCount={code.redemption_count}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
