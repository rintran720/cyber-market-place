"use client";
import type { Rarity } from "@/lib/client/types";

const ALL: { key: Rarity; label: string; color: string }[] = [
  { key: "common", label: "Common", color: "fg-muted" },
  { key: "rare", label: "Rare", color: "green" },
  { key: "epic", label: "Epic", color: "purple" },
  { key: "legendary", label: "Legendary", color: "yellow" },
  { key: "mythic", label: "Mythic", color: "cyan" },
  { key: "unique", label: "1/1 Unique", color: "magenta" },
];

type Props = {
  value: Rarity[];
  onChange: (v: Rarity[]) => void;
};

export function RarityFilter({ value, onChange }: Props) {
  const toggle = (k: Rarity) =>
    onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <fieldset>
      <legend className="cp-field__label">// RARITY</legend>
      <div className="flex flex-col gap-2 mt-2">
        {ALL.map((o) => (
          <label key={o.key} className={`cp-check cp-check--${o.color === "fg-muted" ? "cyan" : o.color}`}>
            <input
              type="checkbox"
              className="cp-check__input"
              checked={value.includes(o.key)}
              onChange={() => toggle(o.key)}
            />
            <span className="cp-check__box" />
            <span className={`cp-chip cp-chip--${o.color} text-[10px]`}>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
