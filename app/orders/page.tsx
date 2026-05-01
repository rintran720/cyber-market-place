"use client";

import Link from "next/link";
import { useOrders } from "@/lib/client/hooks/useOrders";
import { useItems } from "@/lib/client/hooks/useItems";
import { formatNeon, formatRelativeTime, formatTxHash } from "@/lib/format";
import { NeonHeading } from "@/components/decorative/NeonHeading";
import { EmptyState } from "@/components/feedback/EmptyState";
import Image from "next/image";

export default function OrdersPage() {
  const { orders, isLoading, error } = useOrders();
  const { items } = useItems({});

  const slugMap = new Map(items.map((w) => [w.slug, w]));

  if (isLoading) return <p className="text-cp-fg-muted">Loading order log...</p>;
  if (error) return <p className="text-cp-red">[{(error as { code?: string }).code ?? "ERR"}] {error.message}</p>;
  if (orders.length === 0) {
    return <EmptyState title="No orders yet" desc="Your transaction history is empty." cta={<Link href="/browse" className="cp-btn cp-btn--neon cp-btn--cyan">BROWSE ARSENAL ›</Link>} />;
  }

  return (
    <div>
      <NeonHeading level="lg" rarity="cyan">{"// ORDER HISTORY"}</NeonHeading>
      <ol className="cp-timeline mt-8">
        {orders.map((o) => (
          <li
            key={o.id}
            className={`cp-timeline__item ${
              o.status === "confirmed" ? "cp-timeline__item--green" : o.status === "failed" ? "cp-timeline__item--red" : "cp-timeline__item--yellow"
            }`}
          >
            <span className="cp-timeline__time font-cp-mono">{formatRelativeTime(o.createdAt)}</span>
            <span className="cp-timeline__marker" />
            <div className="cp-timeline__content">
              <p className="cp-timeline__title">
                Order {o.id} ·{" "}
                <span className="text-cp-fg-muted">tx </span>
                <button
                  type="button"
                  className="font-cp-mono text-cp-cyan-500 hover:underline"
                  onClick={() => navigator.clipboard?.writeText(o.txHash)}
                  aria-label="Copy tx hash"
                >
                  {formatTxHash(o.txHash)}
                </button>
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {o.lines.map((l) => {
                  const w = slugMap.get(l.itemSlug);
                  if (!w) return <span key={l.itemSlug} className="text-cp-fg-muted text-xs">{l.itemSlug} ×{l.qty}</span>;
                  return (
                    <Link key={l.itemSlug} href={`/browse/${w.slug}`} className="flex items-center gap-2 border border-cp-border px-2 py-1 hover:border-cp-cyan-500">
                      <span className="block w-6 h-6 relative overflow-hidden">
                        <Image src={w.imageUrl} alt={w.name} fill sizes="24px" style={{ objectFit: "cover" }} />
                      </span>
                      <span className="text-xs">{w.name} ×{l.qty}</span>
                    </Link>
                  );
                })}
              </div>
              <p className="mt-2 text-cp-yellow-500 font-cp-mono">{formatNeon(o.total, { compact: true })}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
