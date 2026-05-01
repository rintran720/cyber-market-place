"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useItems } from "@/lib/client/hooks/useItems";
import { defaultFilters, FilterSidebar } from "@/components/filters/FilterSidebar";
import { Pagination } from "@/components/filters/Pagination";
import { ItemGrid } from "@/components/item/ItemGrid";
import { ItemGridSkeleton } from "@/components/feedback/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";
import { NeonHeading } from "@/components/decorative/NeonHeading";

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [filters, setFilters] = useState({ ...defaultFilters, q: initialQ });
  const { items, total, page, pageSize, isLoading, error, mutate } = useItems(filters);

  return (
    <div className="flex gap-6 items-start">
      <FilterSidebar value={filters} onChange={setFilters} />
      <section className="flex-1 min-w-0 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <NeonHeading level="lg" rarity="cyan">{"// ARSENAL CATALOG"}</NeonHeading>
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

export default function BrowsePage() {
  return (
    <Suspense fallback={<ItemGridSkeleton count={8} />}>
      <BrowseContent />
    </Suspense>
  );
}
