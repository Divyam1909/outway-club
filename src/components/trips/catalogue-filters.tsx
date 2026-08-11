"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { clsx } from "clsx";
import { CATEGORY_LABELS, formatINR, formatMonth } from "@/lib/utils";

/**
 * Catalogue filters, held entirely in the URL.
 *
 * No local state: the query string is the single source of truth, so a filtered
 * view is shareable, survives a refresh, and the server component re-runs the
 * query rather than the browser filtering a list it already downloaded.
 */

export type FacetData = {
  regions: string[];
  categories: string[];
  months: { value: string; label: string }[];
  maxPrice: number;
};

const DURATIONS = [
  { value: "short", label: "2 to 3 days" },
  { value: "medium", label: "4 to 6 days" },
  { value: "long", label: "7+ days" },
];

const SORTS = [
  { value: "soonest", label: "Departing soonest" },
  { value: "price_low", label: "Price: low to high" },
  { value: "price_high", label: "Price: high to low" },
  { value: "duration", label: "Shortest first" },
  { value: "popular", label: "Best rated" },
];

/** Round up to a clean number so the budget options don't read like ₹47,312. */
function priceSteps(maxPrice: number): number[] {
  if (maxPrice <= 0) return [];
  const ceiling = Math.ceil(maxPrice / 5000) * 5000;
  const steps: number[] = [];
  for (let value = 10000; value < ceiling; value += ceiling <= 40000 ? 5000 : 10000) {
    steps.push(value);
  }
  return steps;
}

export function CatalogueFilters({
  facets,
  resultCount,
}: {
  facets: FacetData;
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const active = [
    ["month", searchParams.get("month"), (v: string) => formatMonth(v)],
    ["region", searchParams.get("region"), (v: string) => v],
    ["category", searchParams.get("category"), (v: string) => CATEGORY_LABELS[v] ?? v],
    [
      "duration",
      searchParams.get("duration"),
      (v: string) => DURATIONS.find((d) => d.value === v)?.label ?? v,
    ],
    ["maxPrice", searchParams.get("maxPrice"), (v: string) => `Under ${formatINR(Number(v))}`],
  ].filter(([, value]) => Boolean(value)) as [string, string, (v: string) => string][];

  const steps = priceSteps(facets.maxPrice);

  return (
    <div className={clsx("transition-opacity", isPending && "opacity-60")}>
      <div className="rounded-2xl border border-border bg-white p-4 shadow-soft sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <SlidersHorizontal size={16} className="text-clay" />
          Narrow it down
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="sr-only" htmlFor="filter-month">
            Month
          </label>
          <select
            id="filter-month"
            className="field"
            value={searchParams.get("month") ?? ""}
            onChange={(e) => setParam("month", e.target.value)}
          >
            <option value="">Any month</option>
            {facets.months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="filter-region">
            Region
          </label>
          <select
            id="filter-region"
            className="field"
            value={searchParams.get("region") ?? ""}
            onChange={(e) => setParam("region", e.target.value)}
          >
            <option value="">Anywhere</option>
            {facets.regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="filter-category">
            Theme
          </label>
          <select
            id="filter-category"
            className="field"
            value={searchParams.get("category") ?? ""}
            onChange={(e) => setParam("category", e.target.value)}
          >
            <option value="">Any theme</option>
            {facets.categories.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category] ?? category}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="filter-duration">
            Duration
          </label>
          <select
            id="filter-duration"
            className="field"
            value={searchParams.get("duration") ?? ""}
            onChange={(e) => setParam("duration", e.target.value)}
          >
            <option value="">Any length</option>
            {DURATIONS.map((duration) => (
              <option key={duration.value} value={duration.value}>
                {duration.label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="filter-price">
            Budget
          </label>
          <select
            id="filter-price"
            className="field"
            value={searchParams.get("maxPrice") ?? ""}
            onChange={(e) => setParam("maxPrice", e.target.value)}
          >
            <option value="">Any budget</option>
            {steps.map((step) => (
              <option key={step} value={step}>
                Under {formatINR(step)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-ink-500" aria-live="polite">
          {resultCount === 0
            ? "No escapes match"
            : `${resultCount} ${resultCount === 1 ? "escape" : "escapes"}`}
        </p>

        {active.map(([key, value, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setParam(key, "")}
            className="inline-flex items-center gap-1.5 rounded-full bg-pine-50 px-3 py-1.5 text-xs font-medium text-pine transition-colors hover:bg-pine-100"
          >
            {label(value)}
            <X size={13} />
          </button>
        ))}

        {active.length > 0 && (
          <button
            type="button"
            onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
            className="text-xs font-medium text-ink-500 underline underline-offset-2 hover:text-ink"
          >
            Clear all
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="filter-sort" className="text-sm text-ink-500">
            Sort
          </label>
          <select
            id="filter-sort"
            className="field w-auto py-2"
            value={searchParams.get("sort") ?? "soonest"}
            onChange={(e) => setParam("sort", e.target.value === "soonest" ? "" : e.target.value)}
          >
            {SORTS.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
