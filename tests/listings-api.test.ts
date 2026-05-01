import { describe, it, expect, vi } from "vitest";
import { GET, POST } from "@/app/api/listings/route";

vi.mock("@/lib/api/delay", () => ({ delay: () => Promise.resolve() }));
vi.mock("@/lib/api/error", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/error")>("@/lib/api/error");
  return { ...actual, maybeError: () => {} };
});

describe("Listings API", () => {
  it("GET returns 8 seeded listings (or more after POSTs)", async () => {
    const res = await GET();
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(8);
    expect(body[0]).toHaveProperty("views");
    expect(body[0]).toHaveProperty("sales");
    expect(body[0]).toHaveProperty("revenue");
  });

  it("POST validates required fields", async () => {
    const res = await POST(
      new Request("http://x", {
        method: "POST",
        body: JSON.stringify({ name: "FOO.bar" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("POST creates a listing visible in subsequent GET", async () => {
    const draft = {
      name: "TEST.weapon",
      subCategory: "melee",
      rarity: "rare",
      priceNeon: 999,
      seller: "john-tran",
      origin: "Test",
      imageUrl: "/items/starter-blade.svg",
      stats: { damage: 30, speed: 30, range: 5, soulCost: 5 },
      lore: "Auto-test relic.",
      stock: 1,
      tags: ["test"],
    };
    const created = await POST(
      new Request("http://x", {
        method: "POST",
        body: JSON.stringify(draft),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(created.status).toBe(200);
    const createdBody = await created.json();
    expect(createdBody.slug).toBeTruthy();
    expect(createdBody.views).toBe(0);

    const list = await (await GET()).json();
    expect(list.find((l: { slug: string }) => l.slug === createdBody.slug)).toBeTruthy();
  });
});
