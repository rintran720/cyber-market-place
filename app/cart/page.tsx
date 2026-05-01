"use client";

import Link from "next/link";
import { useCart } from "@/lib/client/hooks/useCart";
import { CartLine } from "@/components/cart/CartLine";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatNeon } from "@/lib/format";
import { NeonHeading } from "@/components/decorative/NeonHeading";

export default function CartPage() {
  const { cart, updateQty, removeItem, isLoading } = useCart();

  if (isLoading) {
    return <p className="text-cp-fg-muted">scanning cache...</p>;
  }
  if (cart.lines.length === 0) {
    return (
      <EmptyState
        icon="⌗"
        title="No weapons in cache"
        desc="The arsenal is full of relics. Go acquire some."
        cta={
          <Link href="/browse" className="cp-btn cp-btn--neon cp-btn--cyan">
            BROWSE ARSENAL ›
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
      <section>
        <NeonHeading level="lg" rarity="cyan">{"// CART"}</NeonHeading>
        <div className="mt-6">
          {cart.lines.map((line) => {
            const weapon = cart.items.find((w) => w.slug === line.itemSlug);
            if (!weapon) return null;
            return (
              <CartLine
                key={line.itemSlug}
                weapon={weapon}
                qty={line.qty}
                onQty={(n) => updateQty(line.itemSlug, n)}
                onRemove={() => removeItem(line.itemSlug)}
              />
            );
          })}
        </div>
      </section>

      <aside className="sticky top-24 border border-cp-border bg-cp-bg-soft p-5">
        <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500 mb-3">{"// SUMMARY"}</div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><span className="text-cp-fg-muted">Subtotal</span><span className="font-cp-mono">{formatNeon(cart.subtotal, { compact: true })}</span></div>
          <div className="flex justify-between"><span className="text-cp-fg-muted">Blockchain fee (2%)</span><span className="font-cp-mono">{formatNeon(cart.fee, { compact: true })}</span></div>
          <div className="flex justify-between text-cp-yellow-500 font-cp-mono text-2xl mt-2 border-t border-cp-border pt-2">
            <span>TOTAL</span><span>{formatNeon(cart.total, { compact: true })}</span>
          </div>
        </div>
        <Link
          href="/checkout"
          className="block mt-5 px-4 py-3 text-center font-cp-display font-bold tracking-widest hover:brightness-110 transition shadow-cp-glow-magenta"
          style={{
            background: "var(--cp-magenta-500, #ff00ea)",
            color: "#04050b",
            clipPath:
              "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
          }}
        >
          PROCEED TO CHECKOUT ›
        </Link>
      </aside>
    </div>
  );
}
