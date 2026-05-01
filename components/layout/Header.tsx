"use client";

import Link from "next/link";
import { formatNeon } from "@/lib/format";
import { useCart } from "@/lib/client/hooks/useCart";
import { useWallet } from "@/lib/client/hooks/useWallet";
import { GlowToggle } from "./GlowToggle";

export function Header() {
  const { count } = useCart();
  const { wallet, isLoading } = useWallet();

  return (
    <header className="sticky top-0 z-40 border-b border-cp-border bg-cp-bg/80 backdrop-blur">
      <div className="cp-container flex items-center gap-6 py-3">
        <Link href="/" className="font-cp-display text-cp-cyan-500 text-lg tracking-widest">
          ⌬ NEONMARKET
        </Link>
        <nav className="flex gap-4 text-sm uppercase tracking-wider">
          <Link href="/browse" className="text-cp-fg hover:text-cp-cyan-500">Browse</Link>
          <Link href="/orders" className="text-cp-fg-muted hover:text-cp-cyan-500">Orders</Link>
          <Link href="/seller" className="text-cp-fg-muted hover:text-cp-cyan-500">Seller</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <GlowToggle />
          <Link
            href="/cart"
            className="relative cp-chip cp-chip--cyan font-cp-mono text-xs"
            aria-label={`Cart, ${count} items`}
          >
            ⌗ CART
            {count > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-cp-magenta-500 text-cp-bg font-bold text-[10px] flex items-center justify-center shadow-cp-glow-magenta">
                {count}
              </span>
            )}
          </Link>
          <Link
            href="/profile"
            className="cp-chip cp-chip--yellow font-cp-mono text-xs"
            aria-label={`Wallet balance ${wallet?.balanceNeon ?? 0} NEON`}
          >
            {isLoading ? "⟁ ···" : formatNeon(wallet?.balanceNeon ?? 0, { compact: true })}
          </Link>
          <Link
            href="/profile"
            className="cp-avatar cp-avatar--ring cp-avatar--magenta cp-avatar--sm"
            aria-label="John Tran profile"
          >
            <span className="cp-avatar__initials">JT</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
