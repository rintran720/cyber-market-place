"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "@/lib/client/hooks/useCart";
import { formatNeon } from "@/lib/format";
import { CartLine } from "./CartLine";

export function CartDrawer({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}) {
  const { cart, updateQty, removeItem } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      closeRef.current?.focus();
    }
    if (!open && wasOpen.current) {
      triggerRef?.current?.focus({ preventScroll: true });
    }
    wasOpen.current = open;
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-cp-bg/70 backdrop-blur transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 bottom-0 w-[420px] max-w-full bg-cp-bg-soft border-l border-cp-cyan-500/40 shadow-cp-glow-cyan transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ transitionDuration: "320ms", transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-cp-border">
          <h2 id="cart-drawer-title" className="font-cp-display text-lg text-cp-cyan-500">⌗ CART</h2>
          <button ref={closeRef} onClick={onClose} aria-label="Close cart" className="px-3 py-1 hover:text-cp-magenta-500">✕</button>
        </header>
        <div className="overflow-y-auto px-4">
          {cart.lines.length === 0 ? (
            <p className="text-cp-fg-muted text-sm py-8 text-center">No weapons in cache.</p>
          ) : (
            cart.lines.map((line) => {
              const weapon = cart.items.find((w) => w.slug === line.itemSlug);
              if (!weapon) return null;
              return (
                <CartLine
                  key={line.itemSlug}
                  weapon={weapon}
                  qty={line.qty}
                  onQty={(n) => updateQty(line.itemSlug, n)}
                  onRemove={() => removeItem(line.itemSlug)}
                />
              );
            })
          )}
        </div>
        <footer className="px-4 py-4 border-t border-cp-border">
          <div className="flex justify-between text-sm text-cp-fg-muted">
            <span>Subtotal</span>
            <span className="font-cp-mono">{formatNeon(cart.subtotal, { compact: true })}</span>
          </div>
          <div className="flex justify-between text-sm text-cp-fg-muted">
            <span>Blockchain fee (2%)</span>
            <span className="font-cp-mono">{formatNeon(cart.fee, { compact: true })}</span>
          </div>
          <div className="flex justify-between text-cp-yellow-500 font-cp-mono text-lg mt-2">
            <span>TOTAL</span>
            <span>{formatNeon(cart.total, { compact: true })}</span>
          </div>
          <Link
            href="/checkout"
            onClick={onClose}
            className={`block mt-4 px-4 py-3 text-center font-cp-display font-bold tracking-widest transition ${
              cart.lines.length === 0 ? "opacity-40 pointer-events-none" : "hover:brightness-110 shadow-cp-glow-magenta"
            }`}
            style={{
              background: "var(--cp-magenta-500, #ff00ea)",
              color: "#04050b",
              clipPath:
                "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
            }}
          >
            CHECKOUT ›
          </Link>
        </footer>
      </aside>
    </div>
  );
}
