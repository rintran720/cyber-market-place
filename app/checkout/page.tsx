"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/client/hooks/useCart";
import { useCheckout } from "@/lib/client/hooks/useCheckout";
import { useWallet } from "@/lib/client/hooks/useWallet";
import { CheckoutTerminal } from "@/components/cart/CheckoutTerminal";
import { EmptyState } from "@/components/feedback/EmptyState";
import { RarityBadge, rarityColor } from "@/components/item/RarityBadge";
import { formatNeon, formatTxHash } from "@/lib/format";
import type { Order } from "@/lib/client/types";

const STEPS = ["Review", "Confirm Wallet", "Sign"];
const TERMINAL_LINES = [
  "> handshake: connecting to chain-relay...",
  "> verifying wallet 0xJohnT...4ran ok",
  "> bundling 1 transaction(s)",
  "> broadcasting to mempool",
  "> waiting for confirmation",
];

export default function CheckoutPage() {
  const { cart } = useCart();
  const { wallet } = useWallet();
  const { checkout, isProcessing, lastError } = useCheckout();
  const [step, setStep] = useState(0);
  const [signing, setSigning] = useState(false);
  const [done, setDone] = useState<Order | null>(null);

  // Generate a deterministic-feeling draft order ID for visual flair
  const draftId = useMemo(() => {
    const seed = cart.lines.map((l) => l.itemSlug + l.qty).join(":");
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
    return `DRAFT-${Math.abs(h).toString(16).slice(0, 8).padStart(8, "0").toUpperCase()}`;
  }, [cart.lines]);

  const itemCount = cart.lines.reduce((n, l) => n + l.qty, 0);
  // Mock gas estimate: 0.3% of subtotal, capped 50–500 NEON
  const gasEstimate = Math.max(50, Math.min(500, Math.round(cart.subtotal * 0.003)));
  const grandTotal = cart.total + gasEstimate;

  if (cart.lines.length === 0 && !done) {
    return (
      <EmptyState
        icon="⌗"
        title="Nothing to check out"
        desc="Your cart is empty."
        cta={<Link href="/browse" className="cp-btn cp-btn--neon cp-btn--cyan">BROWSE ARSENAL ›</Link>}
      />
    );
  }

  const onSign = async () => {
    setSigning(true);
    try {
      const { order } = await checkout();
      setDone(order);
    } catch {
      // error toast surfaced via useCart/useCheckout
      setSigning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Stepper */}
      <ol className="flex items-center gap-3 text-xs font-cp-mono">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-2 ${i <= step ? "text-cp-cyan-500" : "text-cp-fg-muted"}`}
          >
            <span
              className={`w-7 h-7 grid place-items-center border ${
                i < step ? "border-cp-green-500 text-cp-green-500" : i === step ? "border-cp-cyan-500" : "border-cp-border"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className="uppercase tracking-widest">{s}</span>
            {i < STEPS.length - 1 && <span className="w-10 h-px bg-cp-border" />}
          </li>
        ))}
      </ol>

      {/* Step content */}
      {!done && step === 0 && (
        <section className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* LEFT: Order header + items */}
          <div className="flex flex-col gap-5">
            {/* Header HUD */}
            <div className="flex items-end justify-between border-b border-cp-border pb-4">
              <div>
                <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500 mb-1">
                  // ORDER REVIEW
                </div>
                <h2 className="font-cp-display text-2xl text-cp-fg">Confirm your acquisition</h2>
                <p className="text-cp-fg-muted text-xs mt-1 font-cp-mono">
                  draft-id: <span className="text-cp-magenta-500">{draftId}</span> · {itemCount}{" "}
                  unit{itemCount !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="cp-badge cp-badge--cyan cp-badge--dot">PENDING</span>
            </div>

            {/* Items list */}
            <div className="border border-cp-border bg-cp-bg-soft">
              <div className="px-4 py-2 border-b border-cp-border flex items-center justify-between">
                <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">
                  // ITEMS
                </div>
                <Link
                  href="/cart"
                  className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-cyan-500 hover:underline"
                >
                  ‹ EDIT CART
                </Link>
              </div>
              <ul className="divide-y divide-cp-border">
                {cart.lines.map((l) => {
                  const w = cart.items.find((x) => x.slug === l.itemSlug);
                  if (!w) return null;
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
                        <span className="cp-chip cp-chip--cyan font-cp-mono text-[10px]">
                          ×{l.qty}
                        </span>
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
            </div>

            {/* Delivery / chain info strip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-cp-border p-3">
                <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">
                  CHAIN
                </div>
                <div className="font-cp-mono text-sm text-cp-cyan-500 mt-1">NEON-MAINNET</div>
              </div>
              <div className="border border-cp-border p-3">
                <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">
                  CONFIRM ETA
                </div>
                <div className="font-cp-mono text-sm text-cp-green-500 mt-1">~12s</div>
              </div>
              <div className="border border-cp-border p-3">
                <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">
                  DELIVERY
                </div>
                <div className="font-cp-mono text-sm text-cp-fg mt-1">INSTANT · INV</div>
              </div>
            </div>
          </div>

          {/* RIGHT: Summary panel */}
          <aside className="border border-cp-cyan-500/30 bg-cp-bg-soft shadow-cp-glow-cyan">
            <div className="px-4 py-3 border-b border-cp-border">
              <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500">
                ⌖ COST BREAKDOWN
              </div>
            </div>
            <div className="px-4 py-4 flex flex-col gap-2 text-sm">
              <Row label="SUBTOTAL" value={formatNeon(cart.subtotal, { compact: true })} />
              <Row
                label="CHAIN FEE · 2%"
                value={formatNeon(cart.fee, { compact: true })}
                hint="Protocol fee"
              />
              <Row
                label="GAS · EST"
                value={formatNeon(gasEstimate, { compact: true })}
                hint="Refunded if unused"
                muted
              />
              <hr className="cp-divider my-1" />
              <div className="flex items-end justify-between pt-1">
                <div>
                  <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">
                    GRAND TOTAL
                  </div>
                  <div className="font-cp-mono text-[9px] text-cp-fg-dim mt-0.5">
                    debited at signing
                  </div>
                </div>
                <div className="font-cp-mono text-3xl text-cp-yellow-500 font-bold">
                  {formatNeon(grandTotal, { compact: true })}
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-cp-border">
              <div className="text-cp-fg-muted text-[10px] font-cp-mono">
                Wallet:{" "}
                <span className="text-cp-fg">{wallet?.address ?? "—"}</span>
              </div>
              <div className="text-cp-fg-muted text-[10px] font-cp-mono mt-0.5">
                Balance:{" "}
                <span className="text-cp-yellow-500">
                  {formatNeon(wallet?.balanceNeon ?? 0, { compact: true })}
                </span>
              </div>
            </div>
            <div className="px-4 py-4 border-t border-cp-border">
              <button
                onClick={() => setStep(1)}
                className="w-full cp-btn cp-btn--neon cp-btn--cyan cp-btn--block"
              >
                CONFIRM &amp; CONTINUE ›
              </button>
              <Link
                href="/cart"
                className="block mt-2 text-center font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted hover:text-cp-cyan-500"
              >
                ‹ BACK TO CART
              </Link>
            </div>
          </aside>
        </section>
      )}

      {!done && step === 1 && (
        <section>
          <h2 className="cp-heading cp-heading--md">Confirm wallet</h2>
          <p className="text-cp-fg-muted text-sm mt-2">Pay from {wallet?.address ?? "—"}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="border border-cp-border p-4"><div className="text-cp-fg-muted text-xs">Balance</div><div className="font-cp-mono text-xl mt-1">{formatNeon(wallet?.balanceNeon ?? 0, { compact: true })}</div></div>
            <div className="border border-cp-border p-4"><div className="text-cp-fg-muted text-xs">After</div><div className="font-cp-mono text-xl mt-1 text-cp-yellow-500">{formatNeon((wallet?.balanceNeon ?? 0) - cart.total, { compact: true })}</div></div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(0)} className="cp-btn cp-btn--ghost">‹ BACK</button>
            <button onClick={() => setStep(2)} className="cp-btn cp-btn--neon cp-btn--cyan">CONTINUE ›</button>
          </div>
        </section>
      )}

      {!done && step === 2 && (
        <section>
          <h2 className="cp-heading cp-heading--md">Sign &amp; broadcast</h2>
          {!signing ? (
            <>
              <p className="text-cp-fg-muted text-sm mt-2">Press to broadcast the transaction.</p>
              <button onClick={onSign} disabled={isProcessing} className="mt-4 cp-btn cp-btn--neon cp-btn--magenta">⟁ SIGN &amp; SEND</button>
              {lastError && <p className="mt-3 text-cp-red text-sm">[{lastError.code}] {lastError.message}</p>}
            </>
          ) : (
            <div className="mt-4">
              <CheckoutTerminal lines={TERMINAL_LINES} />
            </div>
          )}
        </section>
      )}

      {/* helper render below */}
      {done && (
        <section className="border border-cp-green-500/40 bg-cp-bg-soft p-6 shadow-cp-glow-green">
          <h2 className="cp-heading cp-heading--md text-cp-green-500">✓ TRANSACTION CONFIRMED</h2>
          <p className="text-cp-fg-muted text-sm mt-2">
            Order <span className="font-cp-mono">{done.id}</span> · tx{" "}
            <span className="font-cp-mono">{formatTxHash(done.txHash)}</span>
          </p>
          <div className="mt-2 font-cp-mono text-2xl text-cp-yellow-500">{formatNeon(done.total, { compact: true })}</div>
          <div className="mt-6 flex gap-3">
            <Link href="/orders" className="cp-btn cp-btn--neon cp-btn--cyan">VIEW ORDERS ›</Link>
            <Link href="/browse" className="cp-btn cp-btn--ghost">CONTINUE BROWSING</Link>
          </div>
        </section>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  hint,
  muted,
}: {
  label: string;
  value: string;
  hint?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <div>
        <div
          className={`font-cp-mono text-[10px] tracking-[0.3em] ${
            muted ? "text-cp-fg-dim" : "text-cp-fg-muted"
          }`}
        >
          {label}
        </div>
        {hint && (
          <div className="font-cp-mono text-[9px] text-cp-fg-dim mt-0.5">{hint}</div>
        )}
      </div>
      <span className={`font-cp-mono ${muted ? "text-cp-fg-muted" : "text-cp-fg"}`}>{value}</span>
    </div>
  );
}
