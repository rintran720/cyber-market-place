"use client";
import type { ItemFilters } from "@/lib/client/types";
import { SearchBox } from "./SearchBox";
import { SubCategoryFilter } from "./SubCategoryFilter";
import { RarityFilter } from "./RarityFilter";
import { PriceRangeSlider } from "./PriceRangeSlider";
import { SortSegmented } from "./SortSegmented";

const PRICE_MIN = 0;
const PRICE_MAX = 1_500_000;

export const defaultFilters: ItemFilters = {
  subCategories: [],
  rarities: [],
  minPrice: PRICE_MIN,
  maxPrice: PRICE_MAX,
  q: "",
  sort: "newest",
  page: 1,
};

type Props = {
  value: ItemFilters;
  onChange: (next: ItemFilters) => void;
};

export function FilterSidebar({ value, onChange }: Props) {
  const set = <K extends keyof ItemFilters>(k: K, v: ItemFilters[K]) =>
    onChange({ ...value, [k]: v, page: k === "page" ? (v as number) : 1 });

  return (
    <aside
      className="cp-stack p-4 border border-cp-border bg-cp-bg-soft"
      style={{ ["--cp-stack-gap" as string]: "1.25rem", width: 280, position: "sticky", top: 80, alignSelf: "start" }}
      aria-label="Filters"
    >
      <SearchBox value={value.q} onChange={(q) => set("q", q)} />
      <SubCategoryFilter value={value.subCategories} onChange={(s) => set("subCategories", s)} />
      <RarityFilter value={value.rarities} onChange={(r) => set("rarities", r)} />
      <PriceRangeSlider
        min={PRICE_MIN}
        max={PRICE_MAX}
        value={[value.minPrice, value.maxPrice]}
        onChange={([lo, hi]) => onChange({ ...value, minPrice: lo, maxPrice: hi, page: 1 })}
      />
      <SortSegmented value={value.sort} onChange={(s) => set("sort", s)} />
      <button className="cp-btn cp-btn--ghost cp-btn--sm" onClick={() => onChange(defaultFilters)}>
        RESET
      </button>
    </aside>
  );
}
