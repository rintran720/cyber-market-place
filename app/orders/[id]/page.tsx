"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useOrder } from "@/lib/client/hooks/useOrder";
import { useItems } from "@/lib/client/hooks/useItems";
import { useCart } from "@/lib/client/hooks/useCart";
import { ErrorState } from "@/components/feedback/ErrorState";
import { RarityBadge, rarityColor } from "@/components/item/RarityBadge";
import { formatNeon, formatRelativeTime, formatTxHash } from "@/lib/format";
import { pushToast } from "@/components/feedback/Toaster";
import type { OrderStatus } from "@/lib/client/types";

const STATUS_STYLE: Record<OrderStatus, { color: string; label: string; icon: string }> = {
  confirmed: { color: "green", label: "CONFIRMED", icon: "✓" },
  pending: { color: "yellow", label: "PENDING", icon: "◌" },
  failed: { color: "red", label: "FAILED", icon: "✕" },
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const { order, isLoading, error, mutate } = useOrder(orderId);
  const { items } = useItems({});
  const { addItem } = useCart();
  const [reordering, setReordering] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div className="cp-skeleton" style={{ height: 32, width: "40%" }} />
        <div className="cp-skeleton" style={{ height: 200, width: "100%" }} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <ErrorState
          code={(error as { code?: string } | undefined)?.code ?? "NOT_FOUND"}
          message={
            (error as { code?: string } | undefined)?.code === "NOT_FOUND"
              ? "This order is not in the registry."
              : error?.message ?? "Order not found"
          }
          retry={(error as { code?: string } | undefined)?.code !== "NOT_FOUND" ? () => mutate() : undefined}
        />
        <div className="mt-6 text-center">
          <Link href="/orders" className="cp-btn cp-btn--ghost cp-btn--cyan">
            ‹ BACK TO ORDERS
          </Link>
        </div>
      </div>
    );
  }

  const status = STATUS_STYLE[order.status];
  const slugMap = new Map(items.map((w) => [w.slug, w]));

  // Recompute breakdown — assume 2% chain fee + small gas
  const subtotal = order.lines.reduce((s, l) => {
    const w = slugMap.get(l.itemSlug);
    return s + (w?.priceNeon ?? 0) * l.qty;
  }, 0);
  const fee = order.total - subtotal > 0 ? order.total - subtotal : Math.round(subtotal * 0.02);
  const itemCount = order.lines.reduce((n, l) => n + l.qty, 0);

  const onCopyTx = () => {
    navigator.clipboard?.writeText(order.txHash);
    pushToast({ tone: "success", message: `Copied tx hash: ${formatTxHash(order.txHash)}` });
  };

  const onReorder = async () => {
    setReordering(true);
    try {
      for (const line of order.lines) {
        await addItem(line.itemSlug, line.qty);
      }
      pushToast({ tone: "success", title: "REORDERED", message: `${itemCount} item${itemCount !== 1 ? "s" : ""} added to cart` });
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <Link
        href="/orders"
        className="font-cp-mono text-[11px] tracking-[0.3em] text-cp-fg-muted hover:text-cp-cyan-500"
      >
        ‹ BACK TO ORDER HISTORY
      </Link>

      {/* HEADER */}
      <header className="border border-cp-border bg-cp-bg-soft p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500 mb-2">
              // ORDER RECEIPT
            </div>
            <h1
              className="cp-heading cp-heading--lg cp-heading--glitch"
              data-text={order.id}
            >
              {order.id}
            </h1>
            <p className="text-cp-fg-muted text-sm mt-2 font-cp-mono">
              {formatRelativeTime(order.createdAt)} ·{" "}
              <span className="text-cp-fg">
                {new Date(order.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 border border-cp-${status.color}-500/40 shadow-cp-glow-${status.color}`}
          >
            <span className={`font-cp-mono text-2xl text-cp-${status.color}-500`}>{status.icon}</span>
            <div>
              <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">STATUS</div>
              <div className={`font-cp-display font-bold text-cp-${status.color}-500`}>{status.label}</div>
            </div>
          </div>
        </div>

        {/* TX hash + meta strip */}
        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={onCopyTx}
            className="border border-cp-border p-3 text-left hover:border-cp-cyan-500 transition group"
            title="Click to copy"
          >
            <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">TX HASH</div>
            <div className="font-cp-mono text-sm text-cp-cyan-500 mt-1 truncate">
              {formatTxHash(order.txHash)} <span className="text-cp-fg-muted text-[10px] ml-1 group-hover:text-cp-cyan-500">⎘</span>
            </div>
          </button>
          <div className="border border-cp-border p-3">
            <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">ITEMS</div>
            <div className="font-cp-mono text-sm text-cp-fg mt-1">
              {itemCount} unit{itemCount !== 1 ? "s" : ""} · {order.lines.length} line{order.lines.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="border border-cp-border p-3">
            <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">CHAIN</div>
            <div className="font-cp-mono text-sm text-cp-fg mt-1">NEON-MAINNET</div>
          </div>
        </div>
      </header>

      {/* ITEMS + TOTAL */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Items list */}
        <section className="border border-cp-border bg-cp-bg-soft">
          <div className="px-4 py-2 border-b border-cp-border font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">
            // LINE ITEMS
          </div>
          <ul className="divide-y divide-cp-border">
            {order.lines.map((l) => {
              const w = slugMap.get(l.itemSlug);
              if (!w) {
                return (
                  <li key={l.itemSlug} className="px-4 py-3 text-cp-fg-muted text-sm">
                    {l.itemSlug} ×{l.qty} <span className="text-cp-red text-xs ml-2">[delisted]</span>
                  </li>
                );
              }
              const color = rarityColor(w.rarity);
              return (
                <li
                  key={l.itemSlug}
                  className="grid grid-cols-[64px_1fr_auto] items-center gap-4 px-4 py-3 hover:bg-cp-bg-soft/50 transition"
                >
                  <Link
                    href={`/browse/${w.slug}`}
                    className={`block w-16 h-16 relative overflow-hidden border border-cp-${color}-500/40`}
                  >
                    <Image
                      src={w.imageUrl}
                      alt={w.name}
                      fill
                      sizes="64px"
                      style={{ objectFit: "cover" }}
                    />
                    <div className="cp-scanlines absolute inset-0 pointer-events-none" />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/browse/${w.slug}`}
                      className="font-cp-display text-base hover:text-cp-cyan-500 truncate block"
                    >
                      {w.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <RarityBadge rarity={w.rarity} />
                      <span className="text-[9px] uppercase tracking-widest text-cp-fg-dim font-cp-mono">
                        {w.subCategory.replace("-", " ")}
                      </span>
                    </div>
                    <p className="text-cp-fg-muted text-xs mt-1 truncate">
                      {w.seller} · {w.origin}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="cp-chip cp-chip--cyan font-cp-mono text-[10px]">×{l.qty}</span>
                    <div className="font-cp-mono text-cp-yellow-500 text-base mt-1">
                      {formatNeon(w.priceNeon * l.qty, { compact: true })}
                    </div>
                    <div className="font-cp-mono text-[9px] text-cp-fg-dim">
                      @ {formatNeon(w.priceNeon, { compact: true })}/ea
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Summary */}
        <aside className={`border border-cp-${status.color}-500/30 bg-cp-bg-soft shadow-cp-glow-${status.color}`}>
          <div className="px-4 py-3 border-b border-cp-border">
            <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500">
              ⌖ RECEIPT TOTAL
            </div>
          </div>
          <div className="px-4 py-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">SUBTOTAL</span>
              <span className="font-cp-mono">{formatNeon(subtotal, { compact: true })}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">CHAIN FEE</span>
              <span className="font-cp-mono">{formatNeon(fee, { compact: true })}</span>
            </div>
            <hr className="cp-divider my-1" />
            <div className="flex items-end justify-between pt-1">
              <div>
                <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">PAID</div>
                <div className="font-cp-mono text-[9px] text-cp-fg-dim mt-0.5">
                  {order.status === "confirmed" ? "settled" : order.status}
                </div>
              </div>
              <div className="font-cp-mono text-3xl text-cp-yellow-500 font-bold">
                {formatNeon(order.total, { compact: true })}
              </div>
            </div>
          </div>
          <div className="px-4 py-4 border-t border-cp-border flex flex-col gap-2">
            <button
              type="button"
              onClick={onReorder}
              disabled={reordering}
              className="w-full cp-btn cp-btn--neon cp-btn--cyan cp-btn--block disabled:opacity-40"
            >
              {reordering ? "ADDING..." : "↻ REORDER"}
            </button>
            <Link
              href="/orders"
              className="block text-center font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted hover:text-cp-cyan-500"
            >
              ‹ BACK TO HISTORY
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
