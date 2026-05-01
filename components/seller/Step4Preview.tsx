"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Weapon } from "@/lib/client/types";
import { ItemCard } from "@/components/item/ItemCard";
import { StatGrid } from "@/components/item/StatGrid";
import { RarityBadge, rarityColor } from "@/components/item/RarityBadge";
import { CheckoutTerminal } from "@/components/cart/CheckoutTerminal";
import { formatNeon, formatTxHash } from "@/lib/format";

type Props = {
  draft: Omit<Weapon, "slug" | "createdAt">;
  isPublishing: boolean;
  publishedSlug: string | null;
  onBack: () => void;
  onPublish: () => Promise<void>;
};

const RARITY_TINT: Record<string, string> = {
  common: "border-cp-border",
  rare: "border-cp-green-500/40 shadow-cp-glow-green",
  epic: "border-cp-purple-500/40 shadow-cp-glow-purple",
  legendary: "border-cp-yellow-500/40 shadow-cp-glow-yellow",
  unique: "border-cp-magenta-500/40 shadow-cp-glow-magenta",
};

const TERMINAL_LINES = [
  "> compiling item-spec",
  "> generating deterministic slug",
  "> hashing artwork blob",
  "> minting NFT v2185.4",
  "> registering with chain-relay 0xN3on...",
  "> publishing to marketplace index",
];

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "draft-listing"
  );
}

export function Step4Preview({ draft, isPublishing, publishedSlug, onBack, onPublish }: Props) {
  const [showTerminal, setShowTerminal] = useState(false);

  const previewSlug = publishedSlug ?? slugify(draft.name);
  const tintClass = RARITY_TINT[draft.rarity] ?? RARITY_TINT.common;
  const color = rarityColor(draft.rarity);

  const previewWeapon: Weapon = useMemo(
    () => ({ ...draft, slug: previewSlug, createdAt: new Date().toISOString() }),
    [draft, previewSlug],
  );

  // Pre-publish checks
  const checklist = useMemo(() => {
    const items: { label: string; ok: boolean; hint?: string }[] = [
      { label: "Name set", ok: draft.name.trim().length > 0 },
      { label: "Image attached", ok: Boolean(draft.imageUrl) },
      { label: "Origin specified", ok: draft.origin.trim().length > 0 },
      { label: "Lore ≥ 20 chars", ok: draft.lore.trim().length >= 20, hint: "Tell the story" },
      { label: "Price > 0", ok: draft.priceNeon > 0 },
      { label: "Stock ≥ 1", ok: draft.stock >= 1 },
      { label: "Tags ≥ 1", ok: draft.tags.length >= 1, hint: "Help discoverability" },
      {
        label: "Stats balanced",
        ok:
          draft.stats.damage + draft.stats.speed + draft.stats.range + draft.stats.soulCost > 0,
      },
    ];
    return items;
  }, [draft]);

  const allPass = checklist.every((c) => c.ok);
  const totalInventoryValue = draft.priceNeon * draft.stock;
  const platformFee = Math.round(draft.priceNeon * 0.005); // 0.5%
  const gasEstimate = Math.max(50, Math.min(500, Math.round(draft.priceNeon * 0.003)));

  const onClick = () => {
    if (!allPass) return;
    setShowTerminal(true);
    void onPublish();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <header className="flex items-end justify-between flex-wrap gap-3 border-b border-cp-border pb-4">
        <div>
          <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-magenta-500 mb-1">
            // PUBLISHING DRAFT
          </div>
          <h2 className="font-cp-display text-3xl text-cp-fg">Preview &amp; broadcast</h2>
          <p className="text-cp-fg-muted text-sm mt-1 font-cp-mono">
            slug-preview:{" "}
            <span className="text-cp-cyan-500">/browse/{previewSlug}</span>
            {" · "}
            <span className="text-cp-fg-dim">final check before chain commit</span>
          </p>
        </div>
        <span
          className={`cp-badge ${
            allPass ? "cp-badge--green cp-badge--dot" : "cp-badge--yellow"
          }`}
        >
          {allPass ? "READY" : "REVIEW REQUIRED"}
        </span>
      </header>

      {/* TWO-COLUMN: Preview card + Details */}
      <div className="grid lg:grid-cols-[minmax(280px,360px)_1fr] gap-6 items-start">
        {/* LEFT: Item preview card with frame */}
        <aside className="flex flex-col gap-3">
          <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">
            // CARD PREVIEW
          </div>
          <div className={`border-2 ${tintClass} p-3 bg-cp-bg-soft`}>
            <ItemCard weapon={previewWeapon} />
          </div>
          <p className="text-[10px] text-cp-fg-dim font-cp-mono leading-relaxed">
            How buyers will see this listing in the marketplace grid.
          </p>
        </aside>

        {/* RIGHT: Specs panel */}
        <section className="border border-cp-border bg-cp-bg-soft">
          {/* Identity */}
          <div className="px-5 py-4 border-b border-cp-border">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <RarityBadge rarity={draft.rarity} size="md" />
              <span className="cp-chip cp-chip--cyan text-[10px]">
                {draft.subCategory.replace("-", " ")}
              </span>
            </div>
            <h3 className="font-cp-display text-2xl">{draft.name || "—"}</h3>
            <p className="text-cp-fg-muted text-xs mt-1">
              by <span className="text-cp-fg">{draft.seller}</span> · origin{" "}
              <span className="text-cp-fg">{draft.origin || "—"}</span>
            </p>
            {draft.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {draft.tags.map((t) => (
                  <span key={t} className={`cp-chip cp-chip--${color} text-[10px]`}>
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="px-5 py-4 border-b border-cp-border">
            <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-cyan-500 mb-3">
              // SPECS
            </div>
            <StatGrid stats={draft.stats} />
          </div>

          {/* Lore */}
          <div className="px-5 py-4 border-b border-cp-border">
            <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-magenta-500 mb-2">
              // PROVENANCE
            </div>
            <p className="text-cp-fg leading-relaxed text-sm">
              {draft.lore || (
                <span className="text-cp-fg-dim italic">No lore provided.</span>
              )}
            </p>
          </div>

          {/* Pricing & supply */}
          <div className="px-5 py-4 grid grid-cols-3 gap-3">
            <div>
              <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">
                LIST PRICE
              </div>
              <div className="font-cp-mono text-2xl text-cp-yellow-500 font-bold mt-1">
                {formatNeon(draft.priceNeon, { compact: true })}
              </div>
            </div>
            <div>
              <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">
                STOCK
              </div>
              <div className="font-cp-mono text-2xl text-cp-fg mt-1">×{draft.stock}</div>
            </div>
            <div>
              <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">
                INVENTORY VALUE
              </div>
              <div className="font-cp-mono text-2xl text-cp-cyan-500 mt-1">
                {formatNeon(totalInventoryValue, { compact: true })}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* PRE-PUBLISH CHECKLIST + FEE DISCLOSURE */}
      {!publishedSlug && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-cp-border bg-cp-bg-soft p-5">
            <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-cyan-500 mb-3">
              // PRE-FLIGHT CHECKS
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {checklist.map((c) => (
                <li
                  key={c.label}
                  className="flex items-start gap-2 font-cp-mono text-[11px]"
                >
                  <span
                    className={`mt-0.5 w-4 h-4 grid place-items-center text-[11px] ${
                      c.ok
                        ? "text-cp-green-500"
                        : "text-cp-yellow-500"
                    }`}
                  >
                    {c.ok ? "✓" : "○"}
                  </span>
                  <span
                    className={c.ok ? "text-cp-fg" : "text-cp-fg-muted"}
                  >
                    {c.label}
                    {c.hint && !c.ok && (
                      <span className="block text-cp-fg-dim text-[9px] mt-0.5">
                        {c.hint}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-cp-yellow-500/30 bg-cp-bg-soft p-5">
            <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-yellow-500 mb-3">
              ⚠ PUBLISHING FEES
            </div>
            <ul className="text-sm flex flex-col gap-2">
              <li className="flex justify-between font-cp-mono">
                <span className="text-cp-fg-muted">Platform fee · 0.5%</span>
                <span className="text-cp-yellow-500">
                  {formatNeon(platformFee, { compact: true })}
                </span>
              </li>
              <li className="flex justify-between font-cp-mono">
                <span className="text-cp-fg-muted">Mint gas · est</span>
                <span className="text-cp-yellow-500">
                  {formatNeon(gasEstimate, { compact: true })}
                </span>
              </li>
              <li className="flex justify-between font-cp-mono pt-2 border-t border-cp-border mt-1">
                <span className="text-cp-fg-muted">Listing minimum</span>
                <span className="text-cp-fg">⟁ 0</span>
              </li>
            </ul>
            <p className="text-cp-fg-dim text-[10px] mt-3 leading-relaxed">
              Fee deducted on each sale. No upfront cost to list. Mint gas refunded
              if rejected by chain.
            </p>
          </div>
        </div>
      )}

      {/* TERMINAL (during/after publish) */}
      {showTerminal && (
        <div className="border border-cp-cyan-500/30 shadow-cp-glow-cyan">
          <CheckoutTerminal
            lines={TERMINAL_LINES}
            finalTxHash={
              publishedSlug ? `0x${publishedSlug.padEnd(32, "0").slice(0, 32)}` : undefined
            }
          />
        </div>
      )}

      {/* SUCCESS PANEL */}
      {publishedSlug && !isPublishing && (
        <div className="border-2 border-cp-green-500/50 bg-cp-bg-soft shadow-cp-glow-green relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 30% 0%, rgba(57,255,20,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(0,240,255,0.3) 0%, transparent 60%)",
            }}
          />
          <div className="relative px-6 py-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-green-500 mb-1">
                  ✓ TX CONFIRMED
                </div>
                <h3 className="font-cp-display text-2xl text-cp-green-500">
                  LISTING PUBLISHED
                </h3>
                <p className="text-cp-fg-muted text-sm mt-1 font-cp-mono">
                  slug: <span className="text-cp-cyan-500">{publishedSlug}</span>
                </p>
                <p className="text-cp-fg-muted text-sm font-cp-mono">
                  tx:{" "}
                  <span className="text-cp-cyan-500">
                    {formatTxHash(`0x${publishedSlug.padEnd(32, "0").slice(0, 32)}`)}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">
                  LIVE @
                </div>
                <div className="font-cp-mono text-sm text-cp-cyan-500 mt-1">
                  /browse/{previewSlug}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <Stat label="LIST PRICE" value={formatNeon(draft.priceNeon, { compact: true })} hue="yellow" />
              <Stat label="STOCK" value={`×${draft.stock}`} hue="cyan" />
              <Stat label="POTENTIAL" value={formatNeon(totalInventoryValue, { compact: true })} hue="green" />
              <Stat label="VIEWS" value="0" hue="magenta" />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/browse/${publishedSlug}`}
                className="cp-btn cp-btn--neon cp-btn--cyan"
              >
                VIEW LISTING ›
              </Link>
              <Link href="/seller" className="cp-btn cp-btn--ghost cp-btn--cyan">
                BACK TO DASHBOARD
              </Link>
              <Link
                href="/seller/new"
                className="cp-btn cp-btn--ghost cp-btn--magenta ml-auto"
              >
                + LIST ANOTHER
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CTA BAR */}
      {!publishedSlug && (
        <div className="flex items-center justify-between border-t border-cp-border pt-4">
          <button
            onClick={onBack}
            disabled={isPublishing}
            className="cp-btn cp-btn--ghost cp-btn--cyan"
          >
            ‹ BACK
          </button>
          <div className="flex items-center gap-3">
            {!allPass && (
              <span className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-yellow-500">
                fix {checklist.filter((c) => !c.ok).length} item
                {checklist.filter((c) => !c.ok).length !== 1 ? "s" : ""} to publish
              </span>
            )}
            <button
              onClick={onClick}
              disabled={isPublishing || !allPass}
              className="inline-flex items-center gap-2 px-7 py-3 font-cp-display font-bold tracking-widest hover:brightness-110 transition shadow-cp-glow-magenta disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "var(--cp-magenta-500, #ff00ea)",
                color: "#04050b",
                clipPath:
                  "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
              }}
            >
              {isPublishing ? "⌬ MINTING..." : "⟁ PUBLISH TO CHAIN"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hue,
}: {
  label: string;
  value: string;
  hue: "cyan" | "magenta" | "yellow" | "green";
}) {
  const text: Record<typeof hue, string> = {
    cyan: "text-cp-cyan-500",
    magenta: "text-cp-magenta-500",
    yellow: "text-cp-yellow-500",
    green: "text-cp-green-500",
  };
  return (
    <div className="border border-cp-border p-3 bg-cp-bg/40">
      <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">{label}</div>
      <div className={`font-cp-mono text-xl font-bold mt-1 ${text[hue]}`}>{value}</div>
    </div>
  );
}
