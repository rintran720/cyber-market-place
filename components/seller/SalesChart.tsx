"use client";

type Props = {
  data: number[];
  height?: number;
};

export function SalesChart({ data, height = 140 }: Props) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const stepX = 100 / (data.length - 1 || 1);
  const points = data
    .map((v, i) => `${(i * stepX).toFixed(2)},${(100 - (v / max) * 90).toFixed(2)}`)
    .join(" ");

  return (
    <div className="border border-cp-border bg-cp-bg-soft p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500">// SALES</div>
          <div className="font-cp-display text-lg">Last 30 days</div>
        </div>
        <div className="font-cp-mono text-cp-fg-muted text-xs">peak {max}/day</div>
      </div>
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        aria-label="30-day sales trend"
      >
        {/* horizontal grid */}
        {[20, 40, 60, 80].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />
        ))}
        {/* tick marks at base */}
        {data.map((_, i) => (
          <line
            key={i}
            x1={(i * stepX).toFixed(2)}
            y1="100"
            x2={(i * stepX).toFixed(2)}
            y2="98"
            stroke="rgba(0,240,255,0.45)"
            strokeWidth="0.5"
          />
        ))}
        {/* fill under curve */}
        <polyline
          points={`0,100 ${points} 100,100`}
          fill="rgba(0,240,255,0.12)"
          stroke="none"
        />
        {/* main line */}
        <polyline
          points={points}
          fill="none"
          stroke="#00f0ff"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
          style={{ filter: "drop-shadow(0 0 4px #00f0ff)" }}
        />
      </svg>
    </div>
  );
}
