// lib/client/types.ts
export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic" | "unique";
export type SubCategory = "melee" | "ranged" | "energy-divine" | "cursed" | "1of1";

export type WeaponStats = {
  damage: number;
  speed: number;
  range: number;
  soulCost: number;
};

// Invariant: subCategory === "1of1" ⟹ rarity === "unique" && stock === 1.
export type Weapon = {
  slug: string;
  name: string;
  subCategory: SubCategory;
  rarity: Rarity;
  priceNeon: number;
  seller: string;
  origin: string;
  imageUrl: string;
  stats: WeaponStats;
  lore: string;
  stock: number;
  tags: string[];
  createdAt: string;
};

export type CartLine = { itemSlug: string; qty: number; addedAt: string };

export type CartResponse = {
  lines: CartLine[];
  items: Weapon[];
  subtotal: number;
  fee: number;
  total: number;
};

export type Wallet = { balanceNeon: number; address: string };

export type OrderStatus = "pending" | "confirmed" | "failed";
export type Order = {
  id: string;
  txHash: string;
  lines: CartLine[];
  total: number;
  status: OrderStatus;
  createdAt: string;
};

export type Listing = Weapon & { views: number; sales: number; revenue: number };
export type SellerStats = {
  totalRevenue: number;
  totalSales: number;
  activeListings: number;
  topItem: string;
};

export type SortKey = "newest" | "price-asc" | "price-desc" | "rarity";

export type ItemFilters = {
  subCategories: SubCategory[];
  rarities: Rarity[];
  minPrice: number;
  maxPrice: number;
  q: string;
  sort: SortKey;
  page: number;
};

export type ItemsResponse = {
  items: Weapon[];
  total: number;
  page: number;
  pageSize: number;
};

export type ApiErrorPayload = {
  error: { code: string; message: string; retryAfter?: number };
};
