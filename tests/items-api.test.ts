import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/items/route";

vi.mock("@/lib/api/delay", () => ({ delay: () => Promise.resolve() }));
vi.mock("@/lib/api/error", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/error")>("@/lib/api/error");
  return { ...actual, maybeError: () => {} };
});

const reqWith = (params: string) =>
  new Request(`http://localhost/api/items${params ? "?" + params : ""}`);

describe("GET /api/items", () => {
  it("returns full first page when no filters", async () => {
    const res = await GET(reqWith(""));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(40);
    expect(body.items.length).toBeLessThanOrEqual(24);
  });

  it("applies subCategory filter from query string (comma-separated)", async () => {
    const res = await GET(reqWith("subCategory=1of1"));
    const body = await res.json();
    expect(body.items.every((w: { subCategory: string }) => w.subCategory === "1of1")).toBe(true);
  });

  it("applies search query", async () => {
    const res = await GET(reqWith("q=mjolnir"));
    const body = await res.json();
    expect(body.items.length).toBe(1);
  });

  it("applies sort=price-asc", async () => {
    const res = await GET(reqWith("sort=price-asc"));
    const body = await res.json();
    for (let i = 1; i < body.items.length; i++) {
      expect(body.items[i - 1].priceNeon).toBeLessThanOrEqual(body.items[i].priceNeon);
    }
  });
});
