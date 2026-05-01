"use client";

import { useEffect, useState } from "react";

type Hue = "cyan" | "magenta" | "yellow" | "green" | "purple";

type Props = {
  label: string;
  value: number;
  max?: number;
  hue?: Hue;
};

const TEXT: Record<Hue, string> = {
  cyan: "text-cp-cyan-500",
  magenta: "text-cp-magenta-500",
  yellow: "text-cp-yellow-500",
  green: "text-cp-green-500",
  purple: "text-cp-purple-500",
};

export function StatHUD({ label, value, max = 100, hue = "cyan" }: Props) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 600;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="border border-cp-border p-3 bg-cp-bg-soft">
      <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted uppercase">{label}</div>
      <div className={`font-cp-mono text-2xl font-bold mt-1 ${TEXT[hue]}`}>{shown}</div>
      <div className="h-1 mt-2 bg-cp-bg overflow-hidden">
        <div
          className="h-full transition-[width] duration-700"
          style={{
            width: `${pct}%`,
            background: `var(--cp-${hue}-500)`,
            boxShadow: `0 0 8px var(--cp-${hue}-500)`,
          }}
        />
      </div>
    </div>
  );
}
