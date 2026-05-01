"use client";

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
};

export function QtyStepper({ value, min = 1, max = 99, onChange }: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="inline-flex border border-cp-border" role="group" aria-label="Quantity">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        className="px-3 py-2 font-cp-mono text-cp-cyan-500 hover:bg-cp-cyan-500/10 disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        className="w-12 text-center bg-cp-bg-soft text-cp-fg font-cp-mono"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
      />
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        className="px-3 py-2 font-cp-mono text-cp-cyan-500 hover:bg-cp-cyan-500/10 disabled:opacity-30"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
