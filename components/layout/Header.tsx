import Link from "next/link";
import { formatNeon } from "@/lib/format";

const HARDCODED_BALANCE = 250_000;

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-cp-border bg-cp-bg/80 backdrop-blur"
    >
      <div className="cp-container flex items-center gap-6 py-3">
        <Link href="/browse" className="font-cp-display text-cp-cyan-500 text-lg tracking-widest">
          ⌬ NEONMARKET
        </Link>
        <nav className="flex gap-4 text-sm uppercase tracking-wider">
          <Link href="/browse" className="text-cp-fg hover:text-cp-cyan-500">Browse</Link>
          <Link href="/orders" className="text-cp-fg-muted hover:text-cp-cyan-500">Orders</Link>
          <Link href="/seller" className="text-cp-fg-muted hover:text-cp-cyan-500">Seller</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="cp-chip cp-chip--yellow font-cp-mono text-xs">
            {formatNeon(HARDCODED_BALANCE, { compact: true })}
          </span>
          <span className="cp-avatar cp-avatar--ring cp-avatar--magenta cp-avatar--sm" aria-label="John Tran">
            <span className="cp-avatar__initials">JT</span>
          </span>
        </div>
      </div>
    </header>
  );
}
