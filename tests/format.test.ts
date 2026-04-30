import { describe, it, expect } from "vitest";
import { formatNeon, formatTxHash, formatRelativeTime } from "@/lib/format";

describe("formatNeon", () => {
  it("formats whole numbers with NEON glyph", () => {
    expect(formatNeon(0)).toBe("⟁ 0");
    expect(formatNeon(248000)).toBe("⟁ 248,000");
  });
  it("rounds floats to integer NEON", () => {
    expect(formatNeon(4200.7)).toBe("⟁ 4,201");
  });
  it("supports compact mode for large amounts", () => {
    expect(formatNeon(1_200_000, { compact: true })).toBe("⟁ 1.2M");
    expect(formatNeon(4200, { compact: true })).toBe("⟁ 4.2K");
    expect(formatNeon(900, { compact: true })).toBe("⟁ 900");
  });
});

describe("formatTxHash", () => {
  it("truncates with ellipsis preserving prefix and suffix", () => {
    expect(formatTxHash("0xa4f2b1c08e9d7f1234567890abcdef")).toBe("0xa4f2…cdef");
  });
  it("returns input untouched if shorter than 12 chars", () => {
    expect(formatTxHash("0x1234")).toBe("0x1234");
  });
});

describe("formatRelativeTime", () => {
  it("returns 'just now' for < 60s ago", () => {
    const t = new Date(Date.now() - 30_000).toISOString();
    expect(formatRelativeTime(t)).toBe("just now");
  });
  it("returns minutes ago when under an hour", () => {
    const t = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelativeTime(t)).toBe("5 min ago");
  });
  it("returns hours ago when under a day", () => {
    const t = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(t)).toBe("3 h ago");
  });
  it("returns days ago when over a day", () => {
    const t = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(t)).toBe("2 d ago");
  });
});
