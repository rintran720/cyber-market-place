"use client";

import Link from "next/link";
import { useListings } from "@/lib/client/hooks/useListings";
import { useStats } from "@/lib/client/hooks/useStats";
import { StatsBar } from "@/components/seller/StatsBar";
import { SalesChart } from "@/components/seller/SalesChart";
import { ListingRow } from "@/components/seller/ListingRow";
import { NeonHeading } from "@/components/decorative/NeonHeading";

export default function SellerDashboard() {
  const { stats, isLoading: statsLoading } = useStats();
  const { listings, isLoading: listLoading } = useListings();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-end justify-between">
        <div>
          <NeonHeading level="lg" rarity="cyan">{"// SELLER DASHBOARD"}</NeonHeading>
          <p className="text-cp-fg-muted text-sm mt-1">@ john-tran</p>
        </div>
        <Link
          href="/seller/new"
          className="inline-flex items-center gap-2 px-5 py-3 font-cp-display font-bold tracking-widest hover:brightness-110 transition shadow-cp-glow-magenta"
          style={{
            background: "var(--cp-magenta-500, #ff00ea)",
            color: "#04050b",
            clipPath:
              "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
          }}
        >
          + LIST NEW WEAPON
        </Link>
      </header>

      <StatsBar stats={statsLoading ? undefined : stats ?? undefined} />

      {stats && <SalesChart data={stats.sales30d} />}

      <section>
        <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500 mb-2">// LISTINGS</div>
        <h3 className="font-cp-display text-xl mb-4">Active inventory</h3>
        {listLoading ? (
          <p className="text-cp-fg-muted">scanning catalogue...</p>
        ) : (
          <table className="cp-table cp-table--bordered cp-table--hover w-full text-sm">
            <thead>
              <tr className="text-left text-cp-fg-muted text-[10px] tracking-[0.3em] font-cp-mono">
                <th className="py-2 pr-2">ITEM</th>
                <th className="py-2 px-2">RARITY</th>
                <th className="py-2 px-2">PRICE</th>
                <th className="py-2 px-2">VIEWS</th>
                <th className="py-2 px-2">SALES</th>
                <th className="py-2 px-2">REVENUE</th>
                <th className="py-2 px-2">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => <ListingRow key={l.slug} listing={l} />)}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
