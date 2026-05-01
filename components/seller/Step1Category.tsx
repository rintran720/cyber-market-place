"use client";

import type { SubCategory } from "@/lib/client/types";

const OPTIONS: { key: SubCategory; label: string; desc: string }[] = [
  { key: "melee", label: "Melee", desc: "Swords, blades, daggers" },
  { key: "ranged", label: "Ranged", desc: "Bows, rifles, throwing" },
  { key: "energy-divine", label: "Energy / Divine", desc: "Mythic-class weaponry" },
  { key: "cursed", label: "Cursed", desc: "Soul-cost gear" },
  { key: "1of1", label: "1 of 1", desc: "Sealed unique relic" },
];

type Props = {
  value?: SubCategory;
  onChange: (v: SubCategory) => void;
  onNext: () => void;
};

export function Step1Category({ value, onChange, onNext }: Props) {
  return (
    <div>
      <h2 className="cp-heading cp-heading--md">Pick a category</h2>
      <p className="text-cp-fg-muted text-sm mt-1">This determines the listing&apos;s filter bucket and chip color.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        {OPTIONS.map((o) => {
          const active = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(o.key)}
              className={`text-left p-4 border transition ${
                active
                  ? "border-cp-cyan-500 shadow-cp-glow-cyan bg-cp-cyan-500/5"
                  : "border-cp-border hover:border-cp-cyan-500/50"
              }`}
            >
              <div className="font-cp-display text-lg">{o.label}</div>
              <div className="text-cp-fg-muted text-xs mt-1">{o.desc}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-6 text-right">
        <button onClick={onNext} disabled={!value} className="cp-btn cp-btn--neon cp-btn--cyan disabled:opacity-40">
          CONTINUE ›
        </button>
      </div>
    </div>
  );
}
