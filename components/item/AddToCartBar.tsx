"use client";

import { useState } from "react";
import type { Weapon } from "@/lib/client/types";
import { useCart } from "@/lib/client/hooks/useCart";
import { formatNeon } from "@/lib/format";
import { QtyStepper } from "./QtyStepper";

export function AddToCartBar({ weapon }: { weapon: Weapon }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [pulse, setPulse] = useState(false);
  const soldOut = weapon.stock === 0;
  const max = Math.max(1, weapon.stock);

  const onAdd = () => {
    addItem(weapon.slug, qty);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 border-t border-cp-border bg-cp-bg/95 backdrop-blur">
      <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">PRICE</div>
          <div className="font-cp-mono text-2xl text-cp-yellow-500 font-bold">
            {formatNeon(weapon.priceNeon * qty, { compact: true })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <QtyStepper value={qty} min={1} max={max} onChange={setQty} />
          <button
            type="button"
            disabled={soldOut}
            onClick={onAdd}
            className={`px-7 py-3 font-cp-display font-bold tracking-widest hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed ${
              pulse ? "scale-105" : ""
            }`}
            style={{
              background: "var(--cp-magenta-500, #ff00ea)",
              color: "#04050b",
              clipPath:
                "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
              boxShadow: pulse ? "0 0 30px rgba(255,0,234,0.7)" : "0 0 15px rgba(255,0,234,0.4)",
              transition: "all 200ms ease",
            }}
          >
            {soldOut ? "SOLD OUT" : "⟁ ADD TO CART"}
          </button>
        </div>
      </div>
    </div>
  );
}
