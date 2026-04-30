import type { ItemFilters, ItemsResponse, Weapon, SortKey } from "@/lib/client/types";

const PAGE_SIZE = 24;

const RARITY_ORDER: Record<string, number> = {
  unique: 5,
  legendary: 4,
  epic: 3,
  rare: 2,
  common: 1,
};

export function applyFilters(items: Weapon[], f: Partial<ItemFilters>): ItemsResponse {
  let out = items.slice();

  if (f.subCategories?.length) {
    const set = new Set(f.subCategories);
    out = out.filter((w) => set.has(w.subCategory));
  }
  if (f.rarities?.length) {
    const set = new Set(f.rarities);
    out = out.filter((w) => set.has(w.rarity));
  }
  if (typeof f.minPrice === "number") out = out.filter((w) => w.priceNeon >= f.minPrice!);
  if (typeof f.maxPrice === "number") out = out.filter((w) => w.priceNeon <= f.maxPrice!);

  if (f.q && f.q.trim()) {
    const q = f.q.trim().toLowerCase();
    out = out.filter((w) =>
      w.name.toLowerCase().includes(q) ||
      w.seller.toLowerCase().includes(q) ||
      w.origin.toLowerCase().includes(q) ||
      w.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  const sort: SortKey = f.sort ?? "newest";
  out.sort((a, b) => {
    switch (sort) {
      case "newest": return b.createdAt.localeCompare(a.createdAt);
      case "price-asc": return a.priceNeon - b.priceNeon;
      case "price-desc": return b.priceNeon - a.priceNeon;
      case "rarity": return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
    }
  });

  const total = out.length;
  const page = Math.max(1, f.page ?? 1);
  const start = (page - 1) * PAGE_SIZE;
  const paged = out.slice(start, start + PAGE_SIZE);

  return { items: paged, total, page, pageSize: PAGE_SIZE };
}
