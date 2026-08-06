"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/lib/utils";
import type { Destination } from "@/lib/types";

const SELECT_CLASS =
  "rounded-full border border-border bg-white px-4 py-2.5 text-sm text-ink-700 focus:border-pine focus:outline-none";

export function TripFiltersBar({ destinations }: { destinations: Destination[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = ["category", "destination", "difficulty", "tripType"].some((key) =>
    searchParams.get(key)
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className={SELECT_CLASS}
        value={searchParams.get("destination") ?? ""}
        onChange={(e) => setParam("destination", e.target.value)}
      >
        <option value="">All destinations</option>
        {destinations.map((d) => (
          <option key={d.id} value={d.slug}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        className={SELECT_CLASS}
        value={searchParams.get("category") ?? ""}
        onChange={(e) => setParam("category", e.target.value)}
      >
        <option value="">All categories</option>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        className={SELECT_CLASS}
        value={searchParams.get("difficulty") ?? ""}
        onChange={(e) => setParam("difficulty", e.target.value)}
      >
        <option value="">Any difficulty</option>
        {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        className={SELECT_CLASS}
        value={searchParams.get("tripType") ?? ""}
        onChange={(e) => setParam("tripType", e.target.value)}
      >
        <option value="">Group or private</option>
        <option value="group">Group trip</option>
        <option value="private">Private trip</option>
        <option value="customizable">Customizable</option>
      </select>

      <select
        className={`${SELECT_CLASS} ml-auto`}
        value={searchParams.get("sort") ?? "popular"}
        onChange={(e) => setParam("sort", e.target.value)}
      >
        <option value="popular">Most popular</option>
        <option value="price_low">Price: low to high</option>
        <option value="price_high">Price: high to low</option>
        <option value="duration">Shortest first</option>
      </select>

      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="flex items-center gap-1 text-sm font-medium text-clay hover:underline"
        >
          <X size={14} /> Clear filters
        </button>
      )}
    </div>
  );
}
