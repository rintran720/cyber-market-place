"use client";

import type { SellerStats } from "@/lib/client/types";
import { StatHUD } from "@/components/item/StatHUD";

export function StatsBar({ stats }: { stats?: SellerStats }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="cp-skeleton" style={{ height: 92 }} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatHUD label="REVENUE" value={Math.round(stats.totalRevenue / 1000)} max={Math.max(stats.totalRevenue / 1000, 100)} hue="yellow" />
      <StatHUD label="SALES" value={stats.totalSales} max={Math.max(100, stats.totalSales)} hue="green" />
      <StatHUD label="ACTIVE LISTINGS" value={stats.activeListings} max={Math.max(20, stats.activeListings)} hue="cyan" />
      {/* Top item is text — render separately */}
      <div className="border border-cp-border p-3 bg-cp-bg-soft">
        <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">TOP ITEM</div>
        <div className="font-cp-display text-base text-cp-magenta-500 mt-2 truncate">{stats.topItem}</div>
        <div className="font-cp-mono text-[10px] text-cp-fg-muted mt-1">REVENUE LEADER</div>
      </div>
    </div>
  );
}
