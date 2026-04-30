import Image from "next/image";
import Link from "next/link";
import type { Weapon } from "@/lib/client/types";
import { RarityBadge, rarityColor } from "./RarityBadge";
import { PriceTag } from "./PriceTag";
import { StockIndicator } from "./StockIndicator";

type Props = {
  weapon: Weapon;
};

export function ItemCard({ weapon }: Props) {
  const color = rarityColor(weapon.rarity);
  const isHigh = weapon.rarity === "mythic" || weapon.rarity === "unique";
  const cls = [
    "cp-card",
    "cp-card--cut",
    `cp-card--${color}`,
    isHigh ? "animate-cp-pulse" : "",
    "transition-transform",
    "hover:-translate-y-0.5",
  ].join(" ");

  return (
    <Link href={`/browse/${weapon.slug}`} className={cls}>
      <div className="relative" style={{ aspectRatio: "1 / 1", overflow: "hidden" }}>
        <Image
          src={weapon.imageUrl}
          alt={weapon.name}
          width={600}
          height={600}
          sizes="(max-width: 768px) 100vw, 25vw"
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
        <div className="cp-scanlines" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
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
    </Link>
  );
}
