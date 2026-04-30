"use client";
import type { SortKey } from "@/lib/client/types";

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
  { key: "rarity", label: "Rarity" },
];

export function SortSegmented({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <div className="cp-segmented cp-segmented--cyan" role="group" aria-label="Sort order">
      {OPTIONS.map((o) => (
        <label key={o.key} className="cp-segmented__option" data-active={value === o.key ? "true" : "false"}>
          <input
            type="radio"
            name="sort"
            className="cp-segmented__input"
            checked={value === o.key}
            onChange={() => onChange(o.key)}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
