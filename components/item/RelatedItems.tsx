"use client";

import { useItems } from "@/lib/client/hooks/useItems";
import { ItemCard } from "./ItemCard";
import { ItemCardSkeleton } from "@/components/feedback/Skeleton";
import type { Weapon } from "@/lib/client/types";

export function RelatedItems({ current }: { current: Weapon }) {
  const { items, isLoading } = useItems({
    subCategories: [current.subCategory],
    sort: "rarity",
  });
  const others = items.filter((w) => w.slug !== current.slug).slice(0, 4);
  if (!isLoading && others.length === 0) return null;

  return (
    <section>
      <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500 mb-1">
        // COMPATIBLE
      </div>
      <h3 className="font-cp-display text-2xl text-cp-fg mb-4">
        Other {current.subCategory.replace("-", " ")} weapons
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ItemCardSkeleton key={i} />)
          : others.map((w, i) => <ItemCard key={w.slug} weapon={w} index={i} />)}
      </div>
    </section>
  );
}
