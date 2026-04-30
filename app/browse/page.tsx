"use client";

import { useState } from "react";
import { useItems } from "@/lib/client/hooks/useItems";
import { defaultFilters, FilterSidebar } from "@/components/filters/FilterSidebar";
import { Pagination } from "@/components/filters/Pagination";
import { ItemGrid } from "@/components/item/ItemGrid";
import { ItemGridSkeleton } from "@/components/feedback/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";
import { NeonHeading } from "@/components/decorative/NeonHeading";

export default function BrowsePage() {
  const [filters, setFilters] = useState(defaultFilters);
  const { items, total, page, pageSize, isLoading, error, mutate } = useItems(filters);

  return (
    <div className="flex gap-6 items-start">
      <FilterSidebar value={filters} onChange={setFilters} />
      <section className="flex-1 cp-stack" style={{ ["--cp-stack-gap" as string]: "1.5rem" }}>
        <div className="flex items-center justify-between">
          <NeonHeading level="lg" rarity="cyan">// ARSENAL CATALOG</NeonHeading>
          <span className="text-cp-fg-muted text-sm font-cp-mono">
            {isLoading ? "scanning..." : `${total} weapons indexed`}
          </span>
        </div>
        {error ? (
          <ErrorState
            code={(error as { code?: string }).code}
            message={(error as Error).message}
            retry={() => mutate()}
          />
        ) : isLoading ? (
          <ItemGridSkeleton count={8} />
        ) : (
          <ItemGrid items={items} />
        )}
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onChange={(p) => setFilters({ ...filters, page: p })}
        />
      </section>
    </div>
  );
}
