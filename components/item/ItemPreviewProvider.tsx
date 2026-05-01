"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Weapon } from "@/lib/client/types";
import { formatNeon } from "@/lib/format";
import { RarityBadge, rarityColor } from "./RarityBadge";
import { StockIndicator } from "./StockIndicator";

type Ctx = {
  current: Weapon | null;
  open: (w: Weapon) => void;
  close: () => void;
};

const PreviewCtx = createContext<Ctx | null>(null);

export function ItemPreviewProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Weapon | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback((w: Weapon) => {
    triggerRef.current = (document.activeElement as HTMLElement | null) ?? null;
    setCurrent(w);
  }, []);

  const close = useCallback(() => {
    setCurrent(null);
    // restore focus next tick (after dialog unmounts)
    setTimeout(() => triggerRef.current?.focus({ preventScroll: true }), 0);
  }, []);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [current, close]);

  return (
    <PreviewCtx.Provider value={{ current, open, close }}>
      {children}
      {current && <ItemPreviewDialog weapon={current} onClose={close} />}
    </PreviewCtx.Provider>
  );
}

export function useItemPreview() {
  const ctx = useContext(PreviewCtx);
  if (!ctx) throw new Error("useItemPreview must be used inside ItemPreviewProvider");
  return ctx;
}

const RARITY_GLOW: Record<string, { rim: string; soft: string }> = {
  common: { rim: "rgba(138,146,163,0.4)", soft: "rgba(138,146,163,0.15)" },
  rare: { rim: "rgba(57,255,20,0.5)", soft: "rgba(57,255,20,0.18)" },
  epic: { rim: "rgba(189,0,255,0.55)", soft: "rgba(189,0,255,0.2)" },
  legendary: { rim: "rgba(252,238,10,0.6)", soft: "rgba(252,238,10,0.22)" },
  unique: { rim: "rgba(255,0,234,0.7)", soft: "rgba(255,0,234,0.28)" },
};

function ItemPreviewDialog({ weapon, onClose }: { weapon: Weapon; onClose: () => void }) {
  const color = rarityColor(weapon.rarity);
  const glow = RARITY_GLOW[weapon.rarity] ?? RARITY_GLOW.legendary;
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  return (
    <div
      className="cm-modal-backdrop flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cm-preview-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="cm-modal-panel relative grid grid-cols-1 md:grid-cols-2 max-w-[1100px] w-full max-h-[92vh] overflow-y-auto bg-cp-bg border-2"
        style={{
          borderColor: glow.rim,
          boxShadow: `0 0 60px ${glow.soft}, 0 0 120px ${glow.soft}`,
          clipPath:
            "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))",
        }}
      >
        {/* Subtle drifting grid behind everything */}
        <div className="cm-bg-grid-drift absolute inset-0 opacity-30 pointer-events-none" />

        {/* IMAGE SIDE */}
        <div className="relative aspect-square md:aspect-auto md:min-h-[520px] overflow-hidden">
          <Image
            src={weapon.imageUrl}
            alt={weapon.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
            priority
          />
          <div className="cp-scanlines absolute inset-0 pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, transparent 50%, rgba(2,0,12,0.7) 100%)",
            }}
          />
          {/* Reticle corners */}
          <CornerBracket position="tl" color={glow.rim} />
          <CornerBracket position="tr" color={glow.rim} />
          <CornerBracket position="bl" color={glow.rim} />
          <CornerBracket position="br" color={glow.rim} />

          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <RarityBadge rarity={weapon.rarity} size="md" />
            <span className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500 opacity-80">
              [LIVE PREVIEW]
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500 mb-1">
              // {weapon.subCategory.replace("-", " ").toUpperCase()}
            </div>
            <div className="font-cp-display text-3xl md:text-4xl font-bold leading-tight text-cp-fg">
              {weapon.name}
            </div>
            <div className="text-cp-fg-muted text-xs mt-1">
              {weapon.seller} · {weapon.origin}
            </div>
          </div>
        </div>

        {/* INFO SIDE */}
        <div className="relative flex flex-col p-6 md:p-8 gap-6 bg-cp-bg-soft">
          {/* close button */}
          <button
            ref={closeBtnRef}
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center font-cp-mono text-lg border border-cp-border hover:border-cp-magenta-500 hover:text-cp-magenta-500 transition"
          >
            ✕
          </button>

          {/* lore */}
          <div>
            <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-magenta-500 mb-2">
              // PROVENANCE
            </div>
            <p className="text-cp-fg-muted text-sm leading-relaxed">{weapon.lore}</p>
          </div>

          {/* stats grid */}
          <div>
            <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500 mb-2">
              // SPECS
            </div>
            <div className="grid grid-cols-4 gap-2">
              <StatBar label="DMG" value={weapon.stats.damage} hue="cyan" />
              <StatBar label="SPD" value={weapon.stats.speed} hue="green" />
              <StatBar label="RNG" value={weapon.stats.range} hue="yellow" />
              <StatBar label="SOUL" value={weapon.stats.soulCost} hue="magenta" />
            </div>
          </div>

          {/* tags */}
          {weapon.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {weapon.tags.map((t) => (
                <span key={t} className={`cp-chip cp-chip--${color} text-[10px]`}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* meta row */}
          <div className="flex items-center justify-between border-t border-cp-border pt-4">
            <div>
              <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">
                STOCK STATUS
              </div>
              <div className="mt-1">
                <StockIndicator stock={weapon.stock} />
              </div>
            </div>
            <div className="text-right">
              <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">
                PRICE
              </div>
              <div className="font-cp-mono text-3xl text-cp-yellow-500 font-bold">
                {formatNeon(weapon.priceNeon, { compact: true })}
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="grid grid-cols-2 gap-3 mt-auto">
            <button
              type="button"
              className="px-4 py-3 font-cp-display font-bold tracking-widest text-sm hover:brightness-110 transition shadow-cp-glow-magenta"
              style={{
                background: "var(--cp-magenta-500, #ff00ea)",
                color: "#04050b",
                clipPath:
                  "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
              }}
            >
              ⟁ ACQUIRE NOW
            </button>
            <Link
              href={`/browse/${weapon.slug}`}
              onClick={onClose}
              className="px-4 py-3 font-cp-display font-bold tracking-widest text-sm border border-cp-cyan-500 text-cp-cyan-500 hover:bg-cp-cyan-500/10 transition text-center"
            >
              VIEW FULL ›
            </Link>
          </div>

          <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted opacity-70">
            ESC or click outside to close · /browse/{weapon.slug}
          </div>
        </div>
      </div>
    </div>
  );
}

function CornerBracket({
  position,
  color,
}: {
  position: "tl" | "tr" | "bl" | "br";
  color: string;
}) {
  const pos: Record<typeof position, React.CSSProperties> = {
    tl: { top: 12, left: 12, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
    tr: { top: 12, right: 12, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` },
    bl: { bottom: 12, left: 12, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
    br: { bottom: 12, right: 12, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` },
  };
  return (
    <span
      aria-hidden
      className="absolute w-5 h-5 pointer-events-none"
      style={pos[position]}
    />
  );
}

function StatBar({
  label,
  value,
  hue,
}: {
  label: string;
  value: number;
  hue: "cyan" | "magenta" | "yellow" | "green";
}) {
  const text: Record<typeof hue, string> = {
    cyan: "text-cp-cyan-500",
    magenta: "text-cp-magenta-500",
    yellow: "text-cp-yellow-500",
    green: "text-cp-green-500",
  };
  return (
    <div className="border border-cp-border p-2.5">
      <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">{label}</div>
      <div className={`font-cp-mono text-xl font-bold ${text[hue]} mt-1`}>{value}</div>
      <div className="h-1 mt-2 bg-cp-bg overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${Math.min(100, value)}%`,
            background: `var(--cp-${hue}-500)`,
            boxShadow: `0 0 8px var(--cp-${hue}-500)`,
            transition: "width 600ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
    </div>
  );
}
