"use client";

import { useMemo, useState } from "react";
import { useOrders } from "@/lib/client/hooks/useOrders";
import { useItems } from "@/lib/client/hooks/useItems";
import { useWallet } from "@/lib/client/hooks/useWallet";
import { ItemCard } from "@/components/item/ItemCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatNeon } from "@/lib/format";
import { NeonHeading } from "@/components/decorative/NeonHeading";

export default function ProfilePage() {
  const { wallet } = useWallet();
  const { orders } = useOrders();
  const { items } = useItems({});
  const [tab, setTab] = useState<"inventory" | "history">("inventory");

  const inventory = useMemo(() => {
    const owned = new Map<string, number>();
    for (const o of orders) {
      if (o.status !== "confirmed") continue;
      for (const l of o.lines) owned.set(l.itemSlug, (owned.get(l.itemSlug) ?? 0) + l.qty);
    }
    return Array.from(owned.entries())
      .map(([slug, qty]) => ({ weapon: items.find((w) => w.slug === slug), qty }))
      .filter((x): x is { weapon: NonNullable<typeof x.weapon>; qty: number } => Boolean(x.weapon));
  }, [orders, items]);

  return (
    <div>
      <header className="flex items-center gap-6 mb-8">
        <span className="cp-avatar cp-avatar--ring cp-avatar--magenta cp-avatar--lg">
          <span className="cp-avatar__initials">JT</span>
        </span>
        <div>
          <h1 className="cp-heading cp-heading--md">John Tran</h1>
          <p className="text-cp-fg-muted font-cp-mono text-xs mt-1">@ {wallet?.address ?? "—"}</p>
        </div>
        <div className="ml-auto border border-cp-yellow-500/40 px-4 py-2 shadow-cp-glow-yellow">
          <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">BALANCE</div>
          <div className="font-cp-mono text-2xl text-cp-yellow-500 font-bold">
            {formatNeon(wallet?.balanceNeon ?? 0, { compact: true })}
          </div>
        </div>
      </header>

      <div className="cp-tabs">
        <div className="cp-tabs__list" role="tablist">
          <button onClick={() => setTab("inventory")} className="cp-tabs__tab" data-state={tab === "inventory" ? "active" : ""}>Inventory</button>
          <button onClick={() => setTab("history")} className="cp-tabs__tab" data-state={tab === "history" ? "active" : ""}>Order history</button>
        </div>
        <div className="cp-tabs__panels mt-6">
          {tab === "inventory" && (
            inventory.length === 0 ? (
              <EmptyState title="Empty inventory" desc="Buy something to see it here." />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {inventory.map(({ weapon, qty }, i) => (
                  <div key={weapon.slug} className="relative">
                    <ItemCard weapon={weapon} index={i} />
                    {qty > 1 && (
                      <span className="absolute top-2 left-2 cp-badge cp-badge--cyan z-10">×{qty}</span>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
          {tab === "history" && (
            <NeonHeading level="md" rarity="cyan">See <a href="/orders" className="underline">/orders</a></NeonHeading>
          )}
        </div>
      </div>
    </div>
  );
}
