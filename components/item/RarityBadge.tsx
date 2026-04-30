import type { Rarity } from "@/lib/client/types";

const RARITY_LABEL: Record<Rarity, string> = {
  common: "COMMON",
  rare: "▲ RARE",
  epic: "◇ EPIC",
  legendary: "★ LEGENDARY",
  unique: "⬢ 1/1 UNIQUE",
};

const RARITY_COLOR: Record<Rarity, string> = {
  common: "fg-muted",
  rare: "green",
  epic: "purple",
  legendary: "yellow",
  unique: "magenta",
};

export function RarityBadge({ rarity, size = "sm" }: { rarity: Rarity; size?: "sm" | "md" }) {
  const color = RARITY_COLOR[rarity];
  const cls = `cp-badge cp-badge--${color} ${size === "md" ? "cp-badge--lg" : ""}`;
  return <span className={cls}>{RARITY_LABEL[rarity]}</span>;
}

export const rarityColor = (r: Rarity) => RARITY_COLOR[r];
