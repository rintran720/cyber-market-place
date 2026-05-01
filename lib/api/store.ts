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
export const getOrderById = (id: string): Order | undefined =>
  store.orders.find((o) => o.id === id);
export const pushOrder = (order: Order): void => {
  store.orders.unshift(order);
};

import seedListings from "./seed/listings.json";
import type { Listing, SellerStats } from "@/lib/client/types";

type ListingExtras = { views: number; sales: number; revenue: number };
const listingExtras = new Map<string, ListingExtras>();
for (const r of seedListings as (ListingExtras & { slug: string })[]) {
  listingExtras.set(r.slug, { views: r.views, sales: r.sales, revenue: r.revenue });
}

export const getListings = (): Listing[] => {
  const out: Listing[] = [];
  for (const [slug, ext] of listingExtras.entries()) {
    const w = getWeaponBySlug(slug);
    if (!w) continue;
    out.push({ ...w, ...ext });
  }
  return out.sort((a, b) => b.revenue - a.revenue);
};

export const pushListing = (weapon: Weapon): Listing => {
  // mutate store.weapons array in place
  store.weapons.push(weapon);
  listingExtras.set(weapon.slug, { views: 0, sales: 0, revenue: 0 });
  return { ...weapon, views: 0, sales: 0, revenue: 0 };
};

const SECONDS_PER_DAY = 24 * 60 * 60;
void SECONDS_PER_DAY; // suppress unused warning

export const getSellerStats = (): SellerStats & { sales30d: number[] } => {
  let totalRevenue = 0;
  let totalSales = 0;
  let topItem = "—";
  let topRevenue = 0;
  for (const [slug, ext] of listingExtras.entries()) {
    totalRevenue += ext.revenue;
    totalSales += ext.sales;
    if (ext.revenue > topRevenue) {
      topRevenue = ext.revenue;
      topItem = slug;
    }
  }
  // Deterministic-ish 30-day sales array from totals
  const sales30d: number[] = [];
  let seed = totalSales * 31;
  for (let i = 0; i < 30; i++) {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    const base = totalSales / 30;
    const jitter = ((seed >>> 8) % 100) / 100 - 0.5; // -0.5..0.5
    sales30d.push(Math.max(0, Math.round(base + jitter * base * 1.5)));
  }
  return {
    totalRevenue,
    totalSales,
    activeListings: listingExtras.size,
    topItem,
    sales30d,
  };
};
