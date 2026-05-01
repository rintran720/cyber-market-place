"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useItem } from "@/lib/client/hooks/useItem";
import { useItems } from "@/lib/client/hooks/useItems";
import { RarityBadge, rarityColor } from "@/components/item/RarityBadge";
import { StockIndicator } from "@/components/item/StockIndicator";
import { StatGrid } from "@/components/item/StatGrid";
import { GaugeRing } from "@/components/item/GaugeRing";
import { AddToCartBar } from "@/components/item/AddToCartBar";
import { RelatedItems } from "@/components/item/RelatedItems";
import { ErrorState } from "@/components/feedback/ErrorState";
import Loading from "./loading";
import { formatNeon } from "@/lib/format";

export default function ItemDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { item, isLoading, error, mutate } = useItem(slug);
  const { items: peers } = useItems({ subCategories: item ? [item.subCategory] : [] });

  if (isLoading) return <Loading />;
  if (error || !item) {
    const code = (error as { code?: string } | undefined)?.code;
    const isNotFound = code === "NOT_FOUND";
    return (
      <div className="py-16">
        <ErrorState
          code={code}
          message={error?.message ?? "Weapon not found"}
          retry={isNotFound ? undefined : () => mutate()}
        />
        <div className="mt-6 text-center">
          <Link href="/browse" className="cp-btn cp-btn--ghost cp-btn--cyan">
            ‹ BACK TO ARSENAL
          </Link>
        </div>
      </div>
    );
  }

  const median =
    peers.length > 0
      ? peers.map((w) => w.priceNeon).sort((a, b) => a - b)[Math.floor(peers.length / 2)]
      : item.priceNeon;
  const ratio = (item.priceNeon / Math.max(1, median)) * 50;
  const ratioCapped = Math.min(100, ratio);
  const color = rarityColor(item.rarity);

  return (
    <div className="flex flex-col gap-12 pb-24">
      <Link
        href="/browse"
        className="font-cp-mono text-[11px] tracking-[0.3em] text-cp-fg-muted hover:text-cp-cyan-500"
      >
        ‹ BACK TO ARSENAL
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* IMAGE */}
        <div
          className={`relative aspect-square overflow-hidden cp-card cp-card--cut cp-card--${color}`}
        >
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
            priority
          />
          <div className="cp-scanlines absolute inset-0 pointer-events-none" />
          <div className="absolute top-3 left-3"><RarityBadge rarity={item.rarity} size="md" /></div>
          <div className="absolute top-3 right-3"><StockIndicator stock={item.stock} /></div>
          <div className="absolute bottom-3 left-3 font-cp-mono text-[10px] tracking-[0.3em] text-cp-cyan-500">
            // {item.subCategory.replace("-", " ").toUpperCase()}
          </div>
        </div>

        {/* INFO */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-magenta-500 mb-2">
              // PROVENANCE · {item.origin}
            </div>
            <h1
              className="cp-heading cp-heading--lg cp-heading--glitch text-cp-fg"
              data-text={item.name}
            >
              {item.name}
            </h1>
            <p className="text-cp-fg-muted text-sm mt-2">Listed by {item.seller}</p>
          </div>

          <p className="text-cp-fg leading-relaxed">{item.lore}</p>

          <StatGrid stats={item.stats} />

          <div className="flex items-center gap-6 border-t border-cp-border pt-4">
            <GaugeRing
              value={Math.round(ratioCapped)}
              max={100}
              label="vs median"
              suffix="%"
              hue={ratio > 100 ? "magenta" : "cyan"}
            />
            <div>
              <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">
                MARKET POSITION
              </div>
              <p className="text-cp-fg-muted text-sm mt-1 max-w-xs">
                Median price for {item.subCategory.replace("-", " ")} is{" "}
                <span className="font-cp-mono text-cp-yellow-500">
                  {formatNeon(median, { compact: true })}
                </span>
                . This listing is {ratio > 100 ? "above" : "at or below"} median.
              </p>
            </div>
          </div>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <span key={t} className={`cp-chip cp-chip--${color}`}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <RelatedItems current={item} />

      <AddToCartBar weapon={item} />
    </div>
  );
}
