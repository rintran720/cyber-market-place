import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "@/app/api/cart/route";
import { PATCH as PATCH_LINE, DELETE as DELETE_LINE } from "@/app/api/cart/[slug]/route";
import { clearCart } from "@/lib/api/store";

vi.mock("@/lib/api/delay", () => ({ delay: () => Promise.resolve() }));
vi.mock("@/lib/api/error", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/error")>("@/lib/api/error");
  return { ...actual, maybeError: () => {} };
});

const req = (body?: object) =>
  new Request("http://x/api/cart", {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : {},
  });

const slugCtx = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => clearCart());

describe("Cart API", () => {
  it("GET empty cart returns subtotal/fee/total = 0", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.lines).toEqual([]);
    expect(body.subtotal).toBe(0);
    expect(body.fee).toBe(0);
    expect(body.total).toBe(0);
  });

  it("POST adds a line, GET reflects it with 2% fee", async () => {
    await POST(req({ slug: "mjolnir-exe", qty: 2 }));
    const res = await GET();
    const body = await res.json();
    expect(body.lines).toHaveLength(1);
    expect(body.lines[0]).toMatchObject({ itemSlug: "mjolnir-exe", qty: 2 });
    expect(body.subtotal).toBe(8400); // 2 × 4200
    expect(body.fee).toBe(168); // 2%
    expect(body.total).toBe(8568);
  });

  it("POST 400 on unknown slug", async () => {
    const res = await POST(req({ slug: "no-such", qty: 1 }));
    expect(res.status).toBe(400);
  });

  it("PATCH /api/cart/[slug] sets qty", async () => {
    await POST(req({ slug: "mjolnir-exe", qty: 1 }));
    const patchReq = new Request("http://x", {
      method: "PATCH",
      body: JSON.stringify({ qty: 5 }),
      headers: { "content-type": "application/json" },
    });
    await PATCH_LINE(patchReq, slugCtx("mjolnir-exe"));
    const body = await (await GET()).json();
    expect(body.lines[0].qty).toBe(5);
  });

  it("DELETE /api/cart/[slug] removes line", async () => {
    await POST(req({ slug: "mjolnir-exe", qty: 1 }));
    await DELETE_LINE(new Request("http://x"), slugCtx("mjolnir-exe"));
    const body = await (await GET()).json();
    expect(body.lines).toEqual([]);
  });

  it("DELETE /api/cart clears all", async () => {
    await POST(req({ slug: "mjolnir-exe", qty: 1 }));
    await POST(req({ slug: "excalibur-dll", qty: 2 }));
    await DELETE();
    const body = await (await GET()).json();
    expect(body.lines).toEqual([]);
  });
});
