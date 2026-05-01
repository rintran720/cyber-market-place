import type { WeaponStats } from "@/lib/client/types";
import { StatHUD } from "./StatHUD";

export function StatGrid({ stats }: { stats: WeaponStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatHUD label="DAMAGE" value={stats.damage} hue="cyan" />
      <StatHUD label="SPEED" value={stats.speed} hue="green" />
      <StatHUD label="RANGE" value={stats.range} hue="yellow" />
      <StatHUD label="SOUL COST" value={stats.soulCost} hue="magenta" />
    </div>
  );
}
