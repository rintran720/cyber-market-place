// tests/applyFilters.test.ts
import { describe, it, expect } from "vitest";
import { applyFilters } from "@/lib/api/applyFilters";
import { getAllWeapons } from "@/lib/api/store";

const all = getAllWeapons();

describe("applyFilters", () => {
  it("returns all when no filters provided", () => {
    const r = applyFilters(all, {});
    expect(r.items).toHaveLength(24);
    expect(r.total).toBe(40);
  });

  it("filters by sub-category", () => {
    const r = applyFilters(all, { subCategories: ["1of1"] });
    expect(r.items.every((w) => w.subCategory === "1of1")).toBe(true);
    expect(r.total).toBe(r.items.length);
  });

  it("filters by rarity", () => {
    const r = applyFilters(all, { rarities: ["legendary"] });
    expect(r.items.every((w) => w.rarity === "legendary")).toBe(true);
  });

  it("filters by price range inclusive", () => {
    const r = applyFilters(all, { minPrice: 1000, maxPrice: 3000 });
    expect(r.items.every((w) => w.priceNeon >= 1000 && w.priceNeon <= 3000)).toBe(true);
  });

  it("text search matches name, tags, origin, seller", () => {
    expect(applyFilters(all, { q: "mjolnir" }).items.length).toBe(1);
    expect(applyFilters(all, { q: "norse" }).items.length).toBeGreaterThan(1);
    expect(applyFilters(all, { q: "VATICAN" }).items.length).toBeGreaterThan(0);
  });

  it("sorts by newest (default)", () => {
    const r = applyFilters(all, { sort: "newest" });
    for (let i = 1; i < r.items.length; i++) {
      expect(r.items[i - 1].createdAt >= r.items[i].createdAt).toBe(true);
    }
  });

  it("sorts by price ascending", () => {
    const r = applyFilters(all, { sort: "price-asc" });
    for (let i = 1; i < r.items.length; i++) {
      expect(r.items[i - 1].priceNeon <= r.items[i].priceNeon).toBe(true);
    }
  });

  it("paginates with pageSize=24", () => {
    const r = applyFilters(all, { page: 1 });
    expect(r.items.length).toBeLessThanOrEqual(24);
    expect(r.pageSize).toBe(24);
    expect(r.page).toBe(1);
  });

  it("clamps page to last page", () => {
    const r = applyFilters(all, { page: 99 });
    expect(r.total).toBe(40);
    expect(r.page).toBe(99);
  });
});
