"use client";

import { useState } from "react";
import type { Weapon } from "@/lib/client/types";
import { ItemCard } from "@/components/item/ItemCard";
import { CheckoutTerminal } from "@/components/cart/CheckoutTerminal";

type Props = {
  draft: Omit<Weapon, "slug" | "createdAt">;
  isPublishing: boolean;
  publishedSlug: string | null;
  onBack: () => void;
  onPublish: () => Promise<void>;
};

export function Step4Preview({ draft, isPublishing, publishedSlug, onBack, onPublish }: Props) {
  const [showTerminal, setShowTerminal] = useState(false);

  // We need a Weapon-shaped object for ItemCard preview. Add a placeholder slug.
  const previewWeapon: Weapon = {
    ...draft,
    slug: publishedSlug ?? "preview",
    createdAt: new Date().toISOString(),
  };

  const onClick = () => {
    setShowTerminal(true);
    void onPublish();
  };

  return (
    <div>
      <h2 className="cp-heading cp-heading--md">Preview &amp; publish</h2>
      <p className="text-cp-fg-muted text-sm mt-1">Final look before broadcasting.</p>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div>
          <ItemCard weapon={previewWeapon} />
        </div>
        <div className="border border-cp-border bg-cp-bg-soft p-4 text-sm">
          <p><span className="text-cp-fg-muted">Category:</span> {draft.subCategory}</p>
          <p><span className="text-cp-fg-muted">Rarity:</span> {draft.rarity}</p>
          <p><span className="text-cp-fg-muted">Price:</span> ⟁ {draft.priceNeon.toLocaleString()}</p>
          <p><span className="text-cp-fg-muted">Stock:</span> {draft.stock}</p>
          <p><span className="text-cp-fg-muted">Tags:</span> {draft.tags.join(", ") || "none"}</p>
          <hr className="cp-divider my-3" />
          <p className="text-cp-fg-muted">Lore</p>
          <p className="mt-1">{draft.lore}</p>
        </div>
      </div>

      {showTerminal && (
        <div className="mt-6">
          <CheckoutTerminal
            lines={[
              "> compiling item-spec",
              "> generating slug",
              "> minting NFT v2185",
              "> registering with chain-relay",
              "> publishing to marketplace",
            ]}
            finalTxHash={publishedSlug ? `0x${publishedSlug.padEnd(32, "0")}` : undefined}
          />
        </div>
      )}

      {publishedSlug && !isPublishing && (
        <div className="mt-6 border border-cp-green-500/40 p-4 shadow-cp-glow-green">
          <p className="font-cp-display text-cp-green-500 text-lg">✓ LISTING PUBLISHED</p>
          <p className="text-cp-fg-muted text-sm mt-1">slug: <span className="font-cp-mono">{publishedSlug}</span></p>
          <div className="mt-3 flex gap-3">
            <a href={`/browse/${publishedSlug}`} className="cp-btn cp-btn--neon cp-btn--cyan">VIEW LISTING ›</a>
            <a href="/seller" className="cp-btn cp-btn--ghost">BACK TO DASHBOARD</a>
          </div>
        </div>
      )}

      {!publishedSlug && (
        <div className="mt-6 flex justify-between">
          <button onClick={onBack} disabled={isPublishing} className="cp-btn cp-btn--ghost">‹ BACK</button>
          <button onClick={onClick} disabled={isPublishing} className="cp-btn cp-btn--neon cp-btn--magenta">
            {isPublishing ? "MINTING..." : "⟁ PUBLISH"}
          </button>
        </div>
      )}
    </div>
  );
}
