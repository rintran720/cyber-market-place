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
    <div>
      <div className="cp-field__label mb-2">// SORT BY</div>
      <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Sort order">
        {OPTIONS.map((o) => {
          const active = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(o.key)}
              className={`px-2 py-2 text-[11px] font-cp-mono tracking-wider border transition ${
                active
                  ? "border-cp-cyan-500 text-cp-cyan-500 bg-cp-cyan-500/10 shadow-cp-glow-cyan"
                  : "border-cp-border text-cp-fg-muted hover:border-cp-cyan-500/50 hover:text-cp-fg"
              }`}
              aria-pressed={active}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
