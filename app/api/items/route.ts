import { NextResponse } from "next/server";
import { getAllWeapons } from "@/lib/api/store";
import { applyFilters } from "@/lib/api/applyFilters";
import { delay } from "@/lib/api/delay";
import { maybeError, toErrorResponse } from "@/lib/api/error";
import type { ItemFilters, Rarity, SortKey, SubCategory } from "@/lib/client/types";

const VALID_SUB: SubCategory[] = ["melee", "ranged", "energy-divine", "cursed", "1of1"];
const VALID_RARITY: Rarity[] = ["common", "rare", "epic", "legendary", "mythic", "unique"];
const VALID_SORT: SortKey[] = ["newest", "price-asc", "price-desc", "rarity"];

function parseList<T extends string>(raw: string | null, valid: T[]): T[] | undefined {
  if (!raw) return undefined;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean) as T[];
  return parts.filter((p) => valid.includes(p));
}

export async function GET(req: Request): Promise<Response> {
  try {
    await delay();
    maybeError(0.05);

    const url = new URL(req.url);
    const sp = url.searchParams;

    const filters: Partial<ItemFilters> = {
      subCategories: parseList<SubCategory>(sp.get("subCategory"), VALID_SUB),
      rarities: parseList<Rarity>(sp.get("rarity"), VALID_RARITY),
      minPrice: sp.has("minPrice") ? Number(sp.get("minPrice")) : undefined,
      maxPrice: sp.has("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
      q: sp.get("q") ?? undefined,
      sort: (sp.get("sort") as SortKey | null) && VALID_SORT.includes(sp.get("sort") as SortKey)
        ? (sp.get("sort") as SortKey)
        : "newest",
      page: sp.has("page") ? Math.max(1, parseInt(sp.get("page")!, 10) || 1) : 1,
    };

    const result = applyFilters(getAllWeapons(), filters);
    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
