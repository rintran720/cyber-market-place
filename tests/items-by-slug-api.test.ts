// tests/items-by-slug-api.test.ts
import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/items/[slug]/route";

vi.mock("@/lib/api/delay", () => ({ delay: () => Promise.resolve() }));
vi.mock("@/lib/api/error", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/error")>("@/lib/api/error");
  return { ...actual, maybeError: () => {} };
});

const reqWith = (slug: string) =>
  ({ params: Promise.resolve({ slug }) }) as { params: Promise<{ slug: string }> };

describe("GET /api/items/[slug]", () => {
  it("returns 200 + weapon for known slug", async () => {
    const res = await GET(new Request("http://x"), reqWith("mjolnir-exe"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBe("mjolnir-exe");
    expect(body.name).toBe("MJOLNIR.exe");
  });

  it("returns 404 for unknown slug", async () => {
    const res = await GET(new Request("http://x"), reqWith("does-not-exist"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
