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
      <legend className="cp-field__label">RARITY</legend>
      <div className="flex flex-col gap-1.5">
        {ALL.map((o) => (
          <label key={o.key} className="cp-checkbox">
            <input
              type="checkbox"
              className="cp-checkbox__input"
              checked={value.includes(o.key)}
              onChange={() => toggle(o.key)}
            />
            <span className="cp-checkbox__mark" />
            <span className={`cp-chip cp-chip--${o.color}`}>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
