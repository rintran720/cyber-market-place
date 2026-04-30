"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { Rarity, Weapon } from "@/lib/client/types";
import { RarityBadge, rarityColor } from "./RarityBadge";
import { PriceTag } from "./PriceTag";
import { StockIndicator } from "./StockIndicator";
import { useItemPreview } from "./ItemPreviewProvider";

type Props = {
  weapon: Weapon;
  index?: number;
};

const RARITY_GLOW_VAR: Record<Rarity, { glow: string; soft: string; rim: string }> = {
  common:    { glow: "rgba(138,146,163,0.35)", soft: "rgba(138,146,163,0.12)", rim: "#8a92a3" },
  rare:      { glow: "rgba(57,255,20,0.5)",     soft: "rgba(57,255,20,0.18)",   rim: "#39ff14" },
  epic:      { glow: "rgba(189,0,255,0.55)",    soft: "rgba(189,0,255,0.2)",    rim: "#bd00ff" },
  legendary: { glow: "rgba(252,238,10,0.6)",    soft: "rgba(252,238,10,0.22)",  rim: "#fcee0a" },
  mythic:    { glow: "rgba(0,240,255,0.65)",    soft: "rgba(0,240,255,0.25)",   rim: "#00f0ff" },
  unique:    { glow: "rgba(255,0,234,0.7)",     soft: "rgba(255,0,234,0.28)",   rim: "#ff00ea" },
};

export function ItemCard({ weapon, index = 0 }: Props) {
  const color = rarityColor(weapon.rarity);
  const glow = RARITY_GLOW_VAR[weapon.rarity];
  const { open } = useItemPreview();

  const style: CSSProperties = {
    animationDelay: `${Math.min(index, 12) * 60}ms`,
    ["--cm-glow" as string]: glow.glow,
    ["--cm-glow-soft" as string]: glow.soft,
    ["--cm-glow-color" as string]: glow.rim,
  };

  return (
    <button
      type="button"
      onClick={() => open(weapon)}
      data-rarity={weapon.rarity}
      className={`cm-card-float cp-card cp-card--cut cp-card--${color} text-left w-full focus:outline-none focus:ring-2 focus:ring-offset-2`}
      style={style}
      aria-label={`Preview ${weapon.name}`}
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={weapon.imageUrl}
          alt={weapon.name}
          width={600}
          height={600}
          sizes="(max-width: 768px) 100vw, 25vw"
          className="cm-card-image"
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
        <div
          className="cp-scanlines absolute inset-0 pointer-events-none"
        />
        <div className="cm-card-shine" />
        <div className="cm-card-corners" aria-hidden>
          <span /><span /><span /><span />
        </div>
        <div className="cm-card-glitch-line" aria-hidden style={{ top: "30%" }} />
      </div>
      <div className="cp-card__body">
        <div className="flex items-center justify-between mb-2">
          <RarityBadge rarity={weapon.rarity} />
          <StockIndicator stock={weapon.stock} />
        </div>
        <h3 className="cp-card__title font-cp-display text-base">{weapon.name}</h3>
        <p className="text-cp-fg-muted text-xs mb-3">{weapon.seller}</p>
        <div className="flex items-center justify-between">
          <PriceTag value={weapon.priceNeon} />
          <span className="text-cp-fg-dim text-[10px] uppercase tracking-widest">
            {weapon.subCategory.replace("-", " ")}
          </span>
        </div>
      </div>
    </button>
  );
}
