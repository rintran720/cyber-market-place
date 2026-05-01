"use client";

import type { Rarity, WeaponStats } from "@/lib/client/types";
import { formatNeon } from "@/lib/format";

type Draft = {
  rarity: Rarity;
  priceNeon: number;
  origin: string;
  stock: number;
  stats: WeaponStats;
  lore: string;
};

const RARITY_OPTIONS: { key: Rarity; label: string; color: string }[] = [
  { key: "common", label: "Common", color: "fg-muted" },
  { key: "rare", label: "Rare", color: "green" },
  { key: "epic", label: "Epic", color: "purple" },
  { key: "legendary", label: "Legendary", color: "yellow" },
  { key: "unique", label: "1/1 Unique", color: "magenta" },
];

type Props = {
  value: Draft;
  onChange: (next: Draft) => void;
  onNext: () => void;
  onBack: () => void;
  is1of1: boolean;
};

export function Step3PriceStats({ value, onChange, onNext, onBack, is1of1 }: Props) {
  const setStat = (k: keyof WeaponStats, n: number) =>
    onChange({ ...value, stats: { ...value.stats, [k]: n } });

  return (
    <div>
      <h2 className="cp-heading cp-heading--md">Price, stats &amp; lore</h2>

      <fieldset className="mt-6">
        <legend className="cp-field__label">// RARITY</legend>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
          {RARITY_OPTIONS.map((o) => {
            const active = value.rarity === o.key;
            const disabled = is1of1 && o.key !== "unique";
            return (
              <button
                key={o.key}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...value, rarity: o.key, stock: o.key === "unique" ? 1 : value.stock })}
                className={`p-2 border text-xs font-cp-mono tracking-widest transition ${
                  active ? `border-cp-${o.color}-500 shadow-cp-glow-${o.color}` : "border-cp-border"
                } ${disabled ? "opacity-30 cursor-not-allowed" : "hover:border-cp-fg-muted"}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        {is1of1 && (
          <p className="text-cp-fg-muted text-xs mt-2">1-of-1 sub-category locks rarity to <strong>UNIQUE</strong> and stock to <strong>1</strong>.</p>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <label className="cp-field">
          <span className="cp-field__label">// PRICE (NEON)</span>
          <input
            className="cp-input cp-input--cut cp-input--yellow"
            type="number"
            min={1}
            max={5_000_000}
            value={value.priceNeon}
            onChange={(e) => onChange({ ...value, priceNeon: parseInt(e.target.value, 10) || 0 })}
          />
          <span className="cp-field__hint">{formatNeon(value.priceNeon, { compact: true })}</span>
        </label>
        <label className="cp-field">
          <span className="cp-field__label">// ORIGIN</span>
          <input
            className="cp-input cp-input--cut"
            type="text"
            value={value.origin}
            placeholder="Norse / Greek / Cyberpunk-original..."
            onChange={(e) => onChange({ ...value, origin: e.target.value })}
          />
        </label>
        <label className="cp-field">
          <span className="cp-field__label">// STOCK</span>
          <input
            className="cp-input cp-input--cut"
            type="number"
            min={1}
            disabled={is1of1}
            value={value.stock}
            onChange={(e) => onChange({ ...value, stock: parseInt(e.target.value, 10) || 1 })}
          />
        </label>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["damage", "speed", "range", "soulCost"] as const).map((k) => (
          <label key={k} className="block">
            <span className="cp-field__label uppercase">{k}</span>
            <input
              type="range"
              min={0}
              max={100}
              className="cp-slider cp-slider--cyan w-full"
              value={value.stats[k]}
              onChange={(e) => setStat(k, parseInt(e.target.value, 10))}
            />
            <div className="font-cp-mono text-cp-cyan-500 mt-1 text-sm">{value.stats[k]}</div>
          </label>
        ))}
      </div>

      <label className="cp-field mt-6 block">
        <span className="cp-field__label">// LORE</span>
        <textarea
          className="cp-input cp-textarea cp-input--cut"
          rows={4}
          maxLength={500}
          value={value.lore}
          onChange={(e) => onChange({ ...value, lore: e.target.value })}
          placeholder="One-paragraph backstory. The chain demands flavor."
        />
      </label>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="cp-btn cp-btn--ghost">‹ BACK</button>
        <button
          onClick={onNext}
          disabled={!value.priceNeon || !value.origin || !value.lore}
          className="cp-btn cp-btn--neon cp-btn--cyan disabled:opacity-40"
        >
          CONTINUE ›
        </button>
      </div>
    </div>
  );
}
