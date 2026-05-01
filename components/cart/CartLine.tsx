"use client";

import Image from "next/image";
import Link from "next/link";
import type { Weapon } from "@/lib/client/types";
import { formatNeon } from "@/lib/format";
import { QtyStepper } from "@/components/item/QtyStepper";

type Props = {
  weapon: Weapon;
  qty: number;
  onQty: (n: number) => void;
  onRemove: () => void;
};

export function CartLine({ weapon, qty, onQty, onRemove }: Props) {
  return (
    <div className="grid grid-cols-[80px_1fr_auto_auto_auto] items-center gap-4 py-4 border-b border-cp-border">
      <Link href={`/browse/${weapon.slug}`} className="block w-20 h-20 relative overflow-hidden border border-cp-border">
        <Image src={weapon.imageUrl} alt={weapon.name} fill sizes="80px" style={{ objectFit: "cover" }} />
      </Link>
      <div>
        <Link href={`/browse/${weapon.slug}`} className="font-cp-display hover:text-cp-cyan-500">
          {weapon.name}
        </Link>
        <div className="text-cp-fg-muted text-xs mt-1">{weapon.seller}</div>
      </div>
      <QtyStepper value={qty} min={1} max={Math.max(1, weapon.stock)} onChange={onQty} />
      <div className="font-cp-mono text-cp-yellow-500 text-right min-w-[90px]">
        {formatNeon(weapon.priceNeon * qty, { compact: true })}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="px-2 py-1 text-cp-magenta-500 hover:text-cp-magenta-300"
        aria-label={`Remove ${weapon.name}`}
      >
        ✕
      </button>
    </div>
  );
}
