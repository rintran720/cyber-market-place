import seedWeapons from "./seed/weapons.json";
import seedOrders from "./seed/orders.json";
import type { CartLine, Order, Wallet, Weapon } from "@/lib/client/types";

const FEE_RATE = 0.02;

type Store = {
  weapons: Weapon[];
  cart: Map<string, number>; // slug → qty
  wallet: Wallet;
  orders: Order[];
};

const store: Store = {
  weapons: seedWeapons as Weapon[],
  cart: new Map(),
  wallet: { balanceNeon: 250_000, address: "0xJohnT...4ran" },
  orders: (seedOrders as Order[]).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
};

// Weapons
export const getAllWeapons = (): Weapon[] => store.weapons;
export const getWeaponBySlug = (slug: string): Weapon | undefined =>
  store.weapons.find((w) => w.slug === slug);

// Cart
export const getCartLines = (): CartLine[] =>
  Array.from(store.cart.entries()).map(([slug, qty]) => ({
    itemSlug: slug,
    qty,
    addedAt: new Date().toISOString(),
  }));

export const getCartItems = (): Weapon[] => {
  const items: Weapon[] = [];
  for (const slug of store.cart.keys()) {
    const w = getWeaponBySlug(slug);
    if (w) items.push(w);
  }
  return items;
};

export const getCartTotals = () => {
  let subtotal = 0;
  for (const [slug, qty] of store.cart.entries()) {
    const w = getWeaponBySlug(slug);
    if (w) subtotal += w.priceNeon * qty;
  }
  const fee = Math.round(subtotal * FEE_RATE);
  return { subtotal, fee, total: subtotal + fee };
};

export const addCartLine = (slug: string, qty: number): void => {
  if (qty <= 0) return;
  const cur = store.cart.get(slug) ?? 0;
  store.cart.set(slug, cur + qty);
};

export const setCartQty = (slug: string, qty: number): void => {
  if (qty <= 0) store.cart.delete(slug);
  else store.cart.set(slug, qty);
};

export const removeCartLine = (slug: string): void => {
  store.cart.delete(slug);
};

export const clearCart = (): void => {
  store.cart.clear();
};

// Wallet
export const getWallet = (): Wallet => ({ ...store.wallet });
export const setWalletBalance = (n: number): void => {
  store.wallet.balanceNeon = n;
};

// Orders
export const getOrders = (): Order[] => store.orders.slice();
export const pushOrder = (order: Order): void => {
  store.orders.unshift(order);
};
