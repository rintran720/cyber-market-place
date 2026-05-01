"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/client/hooks/useCart";
import { useCheckout } from "@/lib/client/hooks/useCheckout";
import { useWallet } from "@/lib/client/hooks/useWallet";
import { CheckoutTerminal } from "@/components/cart/CheckoutTerminal";
import { EmptyState } from "@/components/feedback/EmptyState";
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
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
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
        <section>
          <h2 className="cp-heading cp-heading--md">Review your order</h2>
          <ul className="mt-4 divide-y divide-cp-border">
            {cart.lines.map((l) => {
              const w = cart.items.find((x) => x.slug === l.itemSlug);
              if (!w) return null;
              return (
                <li key={l.itemSlug} className="py-3 flex justify-between">
                  <span>{w.name} <span className="text-cp-fg-muted text-xs">×{l.qty}</span></span>
                  <span className="font-cp-mono">{formatNeon(w.priceNeon * l.qty, { compact: true })}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 text-right">
            <span className="text-cp-fg-muted text-sm">Total: </span>
            <span className="font-cp-mono text-cp-yellow-500 text-2xl">{formatNeon(cart.total, { compact: true })}</span>
          </div>
          <button onClick={() => setStep(1)} className="mt-6 cp-btn cp-btn--neon cp-btn--cyan">CONTINUE ›</button>
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
