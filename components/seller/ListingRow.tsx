"use client";

import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/client/types";
import { formatNeon } from "@/lib/format";
import { RarityBadge } from "@/components/item/RarityBadge";

export function ListingRow({ listing }: { listing: Listing }) {
  return (
    <tr className="border-b border-cp-border hover:bg-cp-bg-soft/50">
      <td className="py-2 pr-2">
        <div className="flex items-center gap-3">
          <Link href={`/browse/${listing.slug}`} className="block w-12 h-12 relative overflow-hidden border border-cp-border">
            <Image src={listing.imageUrl} alt={listing.name} fill sizes="48px" style={{ objectFit: "cover" }} />
          </Link>
          <div>
            <Link href={`/browse/${listing.slug}`} className="font-cp-display hover:text-cp-cyan-500">{listing.name}</Link>
            <div className="text-cp-fg-muted text-[11px]">{listing.subCategory.replace("-"," ")}</div>
          </div>
        </div>
      </td>
      <td className="py-2 px-2"><RarityBadge rarity={listing.rarity} /></td>
      <td className="py-2 px-2 font-cp-mono text-cp-yellow-500">{formatNeon(listing.priceNeon, { compact: true })}</td>
      <td className="py-2 px-2 font-cp-mono">{listing.views.toLocaleString()}</td>
      <td className="py-2 px-2 font-cp-mono">{listing.sales}</td>
      <td className="py-2 px-2 font-cp-mono text-cp-yellow-500">{formatNeon(listing.revenue, { compact: true })}</td>
      <td className="py-2 px-2">
        {listing.stock > 0 ? (
          <span className="cp-badge cp-badge--green">ACTIVE</span>
        ) : (
          <span className="cp-badge cp-badge--red">SOLD OUT</span>
        )}
      </td>
    </tr>
  );
}
