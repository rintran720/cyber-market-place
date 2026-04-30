import { describe, it, expect } from "vitest";
import { getAllWeapons } from "@/lib/api/store";

describe("seed", () => {
  it("has exactly 40 weapons", () => {
    expect(getAllWeapons()).toHaveLength(40);
  });
  it("all 1of1 sub-cat items have unique rarity and stock=1", () => {
    const ones = getAllWeapons().filter((w) => w.subCategory === "1of1");
    expect(ones.length).toBeGreaterThan(0);
    for (const w of ones) {
      expect(w.rarity).toBe("unique");
      expect(w.stock).toBe(1);
    }
  });
  it("covers every sub-category at least once", () => {
    const cats = new Set(getAllWeapons().map((w) => w.subCategory));
    expect(cats.size).toBe(5);
  });
  it("covers every rarity tier at least once", () => {
    const rarities = new Set(getAllWeapons().map((w) => w.rarity));
    expect(rarities.size).toBe(5);
  });
});
