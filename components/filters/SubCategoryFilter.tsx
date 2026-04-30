"use client";
import type { SubCategory } from "@/lib/client/types";

const ALL: { key: SubCategory; label: string }[] = [
  { key: "melee", label: "Melee" },
  { key: "ranged", label: "Ranged" },
  { key: "energy-divine", label: "Energy / Divine" },
  { key: "cursed", label: "Cursed" },
  { key: "1of1", label: "1 of 1" },
];

type Props = {
  value: SubCategory[];
  onChange: (v: SubCategory[]) => void;
};

export function SubCategoryFilter({ value, onChange }: Props) {
  const toggle = (k: SubCategory) =>
    onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <fieldset>
      <legend className="cp-field__label">CATEGORY</legend>
      <div className="cp-stack" style={{ ["--cp-stack-gap" as string]: "0.5rem" }}>
        {ALL.map((o) => (
          <label key={o.key} className="cp-checkbox">
            <input
              type="checkbox"
              className="cp-checkbox__input"
              checked={value.includes(o.key)}
              onChange={() => toggle(o.key)}
            />
            <span className="cp-checkbox__mark" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
