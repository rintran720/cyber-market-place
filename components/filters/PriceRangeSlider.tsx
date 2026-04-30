"use client";
import { formatNeon } from "@/lib/format";

type Props = {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
};

export function PriceRangeSlider({ min, max, value, onChange }: Props) {
  const [lo, hi] = value;
  return (
    <div>
      <span className="cp-field__label">PRICE</span>
      <div className="text-xs text-cp-fg-muted mb-2">
        {formatNeon(lo, { compact: true })} — {formatNeon(hi, { compact: true })}
      </div>
      <input
        type="range"
        className="cp-slider cp-slider--cyan"
        min={min}
        max={max}
        value={lo}
        onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
        aria-label="Min price"
      />
      <input
        type="range"
        className="cp-slider cp-slider--magenta"
        min={min}
        max={max}
        value={hi}
        onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
        aria-label="Max price"
      />
    </div>
  );
}
