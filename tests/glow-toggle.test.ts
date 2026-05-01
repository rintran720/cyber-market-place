import { describe, it, expect, beforeEach, vi } from "vitest";
import { readGlowPref, writeGlowPref } from "@/components/layout/GlowToggle";

const store: Record<string, string> = {};
const localStorageMock: Storage = {
  length: 0,
  clear: () => Object.keys(store).forEach((k) => delete store[k]),
  getItem: (k) => store[k] ?? null,
  key: (i) => Object.keys(store)[i] ?? null,
  removeItem: (k) => delete store[k],
  setItem: (k, v) => {
    store[k] = String(v);
  },
};
vi.stubGlobal("localStorage", localStorageMock);

beforeEach(() => localStorage.clear());

describe("glow toggle storage", () => {
  it("defaults to 'on' when nothing stored", () => {
    expect(readGlowPref()).toBe("on");
  });
  it("writes and reads 'off'", () => {
    writeGlowPref("off");
    expect(readGlowPref()).toBe("off");
  });
  it("writes and reads 'on'", () => {
    writeGlowPref("off");
    writeGlowPref("on");
    expect(readGlowPref()).toBe("on");
  });
});
