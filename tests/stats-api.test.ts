import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/stats/route";

vi.mock("@/lib/api/delay", () => ({ delay: () => Promise.resolve() }));
vi.mock("@/lib/api/error", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/error")>("@/lib/api/error");
  return { ...actual, maybeError: () => {} };
});

describe("Stats API", () => {
  it("GET returns totals + 30-day sales array", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.totalRevenue).toBe("number");
    expect(typeof body.totalSales).toBe("number");
    expect(typeof body.activeListings).toBe("number");
    expect(typeof body.topItem).toBe("string");
    expect(Array.isArray(body.sales30d)).toBe(true);
    expect(body.sales30d).toHaveLength(30);
  });
});
