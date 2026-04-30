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

  const hasActive =
    value.subCategories.length > 0 ||
    value.rarities.length > 0 ||
    value.q.trim() !== "" ||
    value.minPrice !== PRICE_MIN ||
    value.maxPrice !== PRICE_MAX ||
    value.sort !== "newest";

  return (
    <aside
      className="cp-card cp-card--cut cp-card--cyan shrink-0"
      style={{ width: 280, position: "sticky", top: 80, alignSelf: "start" }}
      aria-label="Filters"
    >
      <div className="cp-card__header flex items-center justify-between">
        <span className="cp-card__title font-cp-mono text-xs tracking-[0.4em] text-cp-cyan-500">
          ⌖ FILTER PANEL
        </span>
        {hasActive && (
          <span className="cp-badge cp-badge--magenta cp-badge--dot">ACTIVE</span>
        )}
      </div>

      <div className="cp-card__body flex flex-col gap-5">
        <SearchBox value={value.q} onChange={(q) => set("q", q)} />

        <hr className="cp-divider" />

        <SubCategoryFilter value={value.subCategories} onChange={(s) => set("subCategories", s)} />

        <hr className="cp-divider" />

        <RarityFilter value={value.rarities} onChange={(r) => set("rarities", r)} />

        <hr className="cp-divider" />

        <PriceRangeSlider
          min={PRICE_MIN}
          max={PRICE_MAX}
          value={[value.minPrice, value.maxPrice]}
          onChange={([lo, hi]) => onChange({ ...value, minPrice: lo, maxPrice: hi, page: 1 })}
        />

        <hr className="cp-divider" />

        <SortSegmented value={value.sort} onChange={(s) => set("sort", s)} />
      </div>

      <div className="cp-card__footer">
        <button
          className={`cp-btn cp-btn--block cp-btn--sm ${
            hasActive ? "cp-btn--solid cp-btn--magenta" : "cp-btn--ghost cp-btn--cyan"
          }`}
          onClick={() => onChange(defaultFilters)}
          disabled={!hasActive}
        >
          {hasActive ? "✕ CLEAR ALL FILTERS" : "RESET"}
        </button>
      </div>
    </aside>
  );
}
