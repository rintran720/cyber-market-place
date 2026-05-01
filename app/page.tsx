"use client";

import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/client/fetcher";
import type { ItemsResponse, Weapon } from "@/lib/client/types";
import { ItemCard } from "@/components/item/ItemCard";
import { ItemCardSkeleton } from "@/components/feedback/Skeleton";
import { formatNeon } from "@/lib/format";

const HERO_BG = "/hero-bg.svg";

function useHomeFeeds() {
  const trending = useSWR<ItemsResponse>("/api/items?sort=rarity", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  });
  const newest = useSWR<ItemsResponse>("/api/items?sort=newest", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  });
  const cheapest = useSWR<ItemsResponse>("/api/items?sort=price-asc", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  });
  return { trending, newest, cheapest };
}

export default function HomePage() {
  const { trending, newest, cheapest } = useHomeFeeds();
  const allItems = trending.data?.items ?? [];
  const combatItems = allItems.filter((w) => w.stats.damage > 0);
  const heroItem: Weapon | undefined = combatItems[0] ?? allItems[0];
  const featured: Weapon[] = allItems.filter((w) => w.slug !== heroItem?.slug).slice(0, 4);
  const newDrops: Weapon[] = (newest.data?.items ?? []).slice(0, 4);
  const starterDeals: Weapon[] = (cheapest.data?.items ?? []).slice(0, 3);

  const totalVolume = allItems.reduce((s, w) => s + w.priceNeon * (w.stock || 1), 0);
  const totalListings = trending.data?.total ?? 0;

  return (
    <div className="flex flex-col gap-16 -mt-8">
      {/* HERO */}
      <section className="relative h-[640px] overflow-hidden border-b border-cp-border">
        <div className="absolute inset-0">
          <Image
            src={HERO_BG}
            alt="Neon market skyline"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
            className="opacity-90"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(2,0,12,0.05) 0%, rgba(2,0,12,0.55) 70%, var(--cp-bg) 100%)",
            }}
          />
          <div className="cp-scanlines absolute inset-0 pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,240,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,234,0.08) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative h-full max-w-[1280px] mx-auto px-6 flex flex-col justify-end pb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="cp-badge cp-badge--magenta cp-badge--dot">LIVE</span>
            <span className="font-cp-mono text-xs uppercase tracking-[0.4em] text-cp-fg-muted">
              year 2185 · neonmarket sector-7
            </span>
          </div>

          <h1
            className="font-cp-display font-bold text-cp-fg"
            style={{ fontSize: "clamp(48px, 8vw, 120px)", lineHeight: 0.95, letterSpacing: "-0.02em" }}
          >
            <span
              className="cp-heading cp-heading--glitch block text-cp-cyan-500"
              data-text="ARSENAL"
              style={{ fontSize: "inherit", lineHeight: "inherit" }}
            >
              ARSENAL
            </span>
            <span
              className="cp-heading cp-heading--glitch block text-cp-magenta-500"
              data-text="OF MYTHS"
              style={{ fontSize: "inherit", lineHeight: "inherit" }}
            >
              OF MYTHS
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-cp-fg text-lg leading-relaxed">
            Mega-corps mine ancient relics from collapsed pantheons.
            <span className="text-cp-magenta-500"> Mjolnir.exe </span>
            crashed Norse-East last cycle.
            <span className="text-cp-yellow-500"> Holy-Grail </span>
            just hit the auction floor at
            <span className="font-cp-mono text-cp-yellow-500"> ⟁ 1.5M</span>.
            Jack in.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-7 py-3 font-cp-display font-bold tracking-widest hover:brightness-110 transition shadow-cp-glow-cyan"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                background: "var(--cp-cyan-500, #00f0ff)",
                color: "#04050b",
              }}
            >
              ENTER ARSENAL ›
            </Link>
            <Link
              href="/seller"
              className="inline-flex items-center gap-2 px-7 py-3 font-cp-display font-bold tracking-widest text-cp-magenta-500 border border-cp-magenta-500 hover:bg-cp-magenta-500/10 transition"
            >
              LIST A WEAPON
            </Link>
          </div>
        </div>

        <div className="absolute top-6 left-6 font-cp-mono text-[10px] tracking-[0.3em] text-cp-cyan-500 opacity-70">
          [SECTOR-07]
        </div>
        <div className="absolute top-6 right-6 font-cp-mono text-[10px] tracking-[0.3em] text-cp-magenta-500 opacity-70">
          NCPD-LICENSED
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-6 w-full flex flex-col gap-16">
        {/* STATS HUD STRIP */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile label="WEAPONS INDEXED" value={String(totalListings || "—")} color="cyan" />
          <StatTile label="VOLUME (24H)" value={formatNeon(totalVolume * 0.07, { compact: true })} color="yellow" />
          <StatTile label="ACTIVE SELLERS" value="24" color="magenta" />
          <StatTile label="NETWORK" value="STABLE · 12ms" color="green" />
        </section>

        {/* HERO ITEM SPOTLIGHT */}
        {heroItem && (
          <section className="grid md:grid-cols-2 gap-8 items-stretch">
            <div className="relative aspect-square overflow-hidden border-2 border-cp-magenta-500/40 shadow-cp-glow-magenta">
              <Image
                src={heroItem.imageUrl}
                alt={heroItem.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
              <div className="cp-scanlines absolute inset-0 pointer-events-none" />
              <div className="absolute top-3 left-3 cp-badge cp-badge--magenta">
                ⬢ APEX RELIC · 1/1
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500 mb-1">
                  // FEATURED · NOW
                </div>
                <div className="font-cp-display text-2xl text-cp-fg">{heroItem.name}</div>
                <div className="text-cp-fg-muted text-xs">{heroItem.seller} · {heroItem.origin}</div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6 p-6 border border-cp-border bg-cp-bg-soft">
              <div>
                <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-magenta-500 mb-3">
                  // APEX SPOTLIGHT
                </div>
                <h2 className="font-cp-display text-3xl text-cp-fg leading-tight">
                  {heroItem.name}
                </h2>
                <p className="mt-4 text-cp-fg-muted text-sm leading-relaxed">{heroItem.lore}</p>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <MiniStat label="DMG" value={heroItem.stats.damage} color="cyan" />
                <MiniStat label="SPD" value={heroItem.stats.speed} color="green" />
                <MiniStat label="RNG" value={heroItem.stats.range} color="yellow" />
                <MiniStat label="SOUL" value={heroItem.stats.soulCost} color="magenta" />
              </div>

              <div className="flex items-end justify-between border-t border-cp-border pt-4">
                <div>
                  <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">PRICE</div>
                  <div className="font-cp-mono text-3xl text-cp-yellow-500 font-bold">
                    {formatNeon(heroItem.priceNeon, { compact: true })}
                  </div>
                </div>
                <Link
                  href={`/browse/${heroItem.slug}`}
                  className="cp-btn cp-btn--neon cp-btn--magenta cp-btn--cut"
                >
                  ACQUIRE ›
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* TRENDING GRID */}
        <Section
          title="// TRENDING"
          subtitle="Top-tier divine weapons in motion this cycle"
          linkText="See all"
          linkHref="/browse?sort=rarity"
        >
          {trending.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ItemCardSkeleton key={i} />)
            : featured.map((w, i) => <ItemCard key={w.slug} weapon={w} index={i} />)}
        </Section>

        {/* NEW DROPS */}
        <Section
          title="// NEW DROPS"
          subtitle="Just listed on the marketplace"
          linkText="Browse new"
          linkHref="/browse?sort=newest"
        >
          {newest.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ItemCardSkeleton key={i} />)
            : newDrops.map((w, i) => <ItemCard key={w.slug} weapon={w} index={i} />)}
        </Section>

        {/* STARTER ROW */}
        <section className="border border-cp-border bg-cp-bg-soft p-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-green-500 mb-1">
                // STARTER PACK
              </div>
              <h3 className="font-cp-display text-2xl">First-cycle deals</h3>
            </div>
            <Link href="/browse?sort=price-asc" className="cp-btn cp-btn--ghost cp-btn--green cp-btn--sm">
              ALL DEALS ›
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {cheapest.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <ItemCardSkeleton key={i} />)
              : starterDeals.map((w, i) => <ItemCard key={w.slug} weapon={w} index={i} />)}
          </div>
        </section>

        {/* CTA STRIP */}
        <section className="relative py-14 px-8 border border-cp-magenta-500/40 overflow-hidden">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, rgba(255,0,234,0.25) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(0,240,255,0.2) 0%, transparent 60%)",
            }}
          />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-magenta-500 mb-2">
                // FOR SELLERS
              </div>
              <h3 className="font-cp-display text-3xl text-cp-fg">
                Got a relic to move?
              </h3>
              <p className="text-cp-fg-muted mt-2 max-w-xl">
                List in 4 steps. Set rarity, draw stats, publish to chain. 0.5% protocol fee, no listing minimum.
              </p>
            </div>
            <Link
              href="/seller"
              className="cp-btn cp-btn--neon cp-btn--magenta cp-btn--cut cp-btn--lg shrink-0"
            >
              OPEN SELLER PANEL ›
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "cyan" | "magenta" | "yellow" | "green";
}) {
  const ring: Record<typeof color, string> = {
    cyan: "border-cp-cyan-500/40 shadow-cp-glow-cyan",
    magenta: "border-cp-magenta-500/40 shadow-cp-glow-magenta",
    yellow: "border-cp-yellow-500/40 shadow-cp-glow-yellow",
    green: "border-cp-green-500/40 shadow-cp-glow-green",
  };
  const text: Record<typeof color, string> = {
    cyan: "text-cp-cyan-500",
    magenta: "text-cp-magenta-500",
    yellow: "text-cp-yellow-500",
    green: "text-cp-green-500",
  };
  return (
    <div className={`relative border ${ring[color]} bg-cp-bg-soft px-4 py-5`}>
      <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted mb-2">
        {label}
      </div>
      <div className={`font-cp-display text-2xl font-bold ${text[color]}`}>
        {value}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "cyan" | "magenta" | "yellow" | "green";
}) {
  const text: Record<typeof color, string> = {
    cyan: "text-cp-cyan-500",
    magenta: "text-cp-magenta-500",
    yellow: "text-cp-yellow-500",
    green: "text-cp-green-500",
  };
  return (
    <div className="border border-cp-border p-3">
      <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">{label}</div>
      <div className={`font-cp-mono text-xl font-bold ${text[color]} mt-1`}>{value}</div>
      <div className="h-1 mt-2 bg-cp-bg overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${Math.min(100, value)}%`,
            background: `var(--cp-${color}-500)`,
            boxShadow: `0 0 8px var(--cp-${color}-500)`,
          }}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  linkText,
  linkHref,
  children,
}: {
  title: string;
  subtitle: string;
  linkText: string;
  linkHref: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500 mb-1">
            {title}
          </div>
          <h3 className="font-cp-display text-2xl text-cp-fg">{subtitle}</h3>
        </div>
        <Link href={linkHref} className="cp-btn cp-btn--ghost cp-btn--cyan cp-btn--sm">
          {linkText} ›
        </Link>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>
    </section>
  );
}
