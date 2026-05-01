"use client";

import { useEffect, useState } from "react";

type Props = {
  value: number;
  max: number;
  label: string;
  suffix?: string;
  size?: number; // px
  hue?: "cyan" | "magenta" | "yellow" | "green";
};

const HUE_HEX: Record<NonNullable<Props["hue"]>, string> = {
  cyan: "#00f0ff",
  magenta: "#ff00ea",
  yellow: "#fcee0a",
  green: "#39ff14",
};

export function GaugeRing({
  value,
  max,
  label,
  suffix = "",
  size = 140,
  hue = "cyan",
}: Props) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimPct(pct * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  const dashoffset = c * (1 - animPct);
  const color = HUE_HEX[hue];

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--cp-border)"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text
          x={size / 2}
          y={size / 2 + 6}
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontWeight="700"
          fontSize="22"
          fill={color}
        >
          {Math.round(value)}
          {suffix}
        </text>
      </svg>
      <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted uppercase">
        {label}
      </div>
    </div>
  );
}
