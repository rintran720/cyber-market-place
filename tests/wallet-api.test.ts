import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/wallet/route";
import { setWalletBalance } from "@/lib/api/store";

vi.mock("@/lib/api/delay", () => ({ delay: () => Promise.resolve() }));
vi.mock("@/lib/api/error", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/error")>("@/lib/api/error");
  return { ...actual, maybeError: () => {} };
});

beforeEach(() => setWalletBalance(250_000));

describe("Wallet API", () => {
  it("GET returns balance + address", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.balanceNeon).toBe(250_000);
    expect(body.address).toMatch(/^0x/);
  });

  it("POST topup adds neon (debug)", async () => {
    const res = await POST(
      new Request("http://x", {
        method: "POST",
        body: JSON.stringify({ amount: 50_000 }),
        headers: { "content-type": "application/json" },
      }),
    );
    const body = await res.json();
    expect(body.balanceNeon).toBe(300_000);
  });
});
