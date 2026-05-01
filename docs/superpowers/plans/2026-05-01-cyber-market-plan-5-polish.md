# Cyber-Market — Plan 5: Polish (Glow Toggle · Animation Refinement · A11y · Final Checklist)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Final polish pass after Plans 1-4 ship: add the persistent glow toggle that flips `data-cp-glow="off"` on `<html>`; refine animation timings + reduced-motion handling; run an accessibility audit (focus rings, ARIA, keyboard, color contrast); update the README; close out the spec's Definition of Done.

**Architecture:** A new `<GlowToggle>` button in the Header reads/writes `localStorage["cp-glow-pref"]` and applies `data-cp-glow="off"` on `document.documentElement`. CSS animation rules in `globals.css` are reviewed and toned down where they get distracting (e.g. clamp continuous-float to legendary tier only — unique already animates intensely; ensure all animations honor `prefers-reduced-motion`). An A11y audit checks focus management on dialog/drawer, keyboard support, ARIA labels, and contrast on common-tier text. Final manual checklist + README sweep.

**Tech Stack:** Next.js 15 · TypeScript · Tailwind v4 · `@rintran720/cyberpunk-ui`

**Spec reference:** `docs/superpowers/specs/2026-04-30-cyber-market-design.md` — sections 7 (visual system), 9 (a11y), 10 (DoD).

---

## File Structure

| File | Responsibility |
|---|---|
| `components/layout/GlowToggle.tsx` | Client button toggling `data-cp-glow` + persisting choice |
| `components/layout/Header.tsx` (modify) | Mount `GlowToggle` next to wallet chip |
| `app/globals.css` (modify) | Tighten animation timings, ensure all motion respects `prefers-reduced-motion`, add `[data-cp-glow="off"]` overrides |
| `components/item/ItemPreviewProvider.tsx` (modify) | Verify focus management: trap focus within dialog, return focus to trigger on close |
| `components/cart/CartDrawer.tsx` (modify) | Same focus-management pass |
| `tests/glow-toggle.test.ts` | Vitest for localStorage round-trip helper |
| `e2e/a11y.spec.ts` | Playwright keyboard navigation smoke test |
| `README.md` (rewrite) | Final tour + scripts + screenshots reference |

---

## Task 1: GlowToggle component

**Files:**
- Create: `components/layout/GlowToggle.tsx`, `tests/glow-toggle.test.ts`

- [ ] **Step 1: Write a failing test for the storage helper**

```ts
// tests/glow-toggle.test.ts
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
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- tests/glow-toggle.test.ts
```

- [ ] **Step 3: Implement `components/layout/GlowToggle.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

const KEY = "cp-glow-pref";

type Pref = "on" | "off";

export function readGlowPref(): Pref {
  if (typeof localStorage === "undefined") return "on";
  return localStorage.getItem(KEY) === "off" ? "off" : "on";
}

export function writeGlowPref(v: Pref): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, v);
}

function applyDom(v: Pref): void {
  if (typeof document === "undefined") return;
  if (v === "off") document.documentElement.setAttribute("data-cp-glow", "off");
  else document.documentElement.removeAttribute("data-cp-glow");
}

export function GlowToggle() {
  const [pref, setPref] = useState<Pref>("on");

  useEffect(() => {
    const v = readGlowPref();
    setPref(v);
    applyDom(v);
  }, []);

  const flip = () => {
    const next: Pref = pref === "on" ? "off" : "on";
    setPref(next);
    writeGlowPref(next);
    applyDom(next);
  };

  return (
    <button
      type="button"
      onClick={flip}
      aria-pressed={pref === "on"}
      aria-label={`Glow effects ${pref === "on" ? "on" : "off"}`}
      title={`Glow ${pref === "on" ? "ON" : "OFF"} — click to toggle`}
      className="cp-chip cp-chip--cyan font-cp-mono text-xs hover:brightness-125"
    >
      ⚡ {pref === "on" ? "ON" : "OFF"}
    </button>
  );
}
```

- [ ] **Step 4: Run — expect PASS (3/3)**

```bash
npm test -- tests/glow-toggle.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add components/layout/GlowToggle.tsx tests/glow-toggle.test.ts
git commit -m "feat: GlowToggle button with localStorage persistence"
```

---

## Task 2: Mount in Header

**Files:**
- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: Add GlowToggle next to the wallet chip**

In the Header's right-side block, insert the toggle just before the wallet chip:

```tsx
import { GlowToggle } from "./GlowToggle";

// inside the right-side flex group:
<GlowToggle />
{/* (existing wallet chip and avatar) */}
```

- [ ] **Step 2: Smoke + commit**

```bash
npx tsc --noEmit
git add components/layout/Header.tsx
git commit -m "feat: mount GlowToggle in header"
```

Verify in browser: clicking the ⚡ chip flips `data-cp-glow` on `<html>`, neon glows fade.

---

## Task 3: Globals CSS — glow override + motion refinements

**Files:**
- Modify: `app/globals.css`

The library's components ship with built-in `data-cp-glow="off"` rules for the `cp-*` classes. We need to make sure our app-local glow utilities (`.cm-card-float`, modal panel shadows, hero-bg layers) ALSO respect the off state.

- [ ] **Step 1: Append glow-off overrides at the bottom of `globals.css`**

```css
/* When user disables glow globally, neutralize app-local glows */
:root[data-cp-glow="off"] .cm-card-float,
:root[data-cp-glow="off"] .cm-card-float[data-rarity] {
  animation: cm-rise-in 600ms cubic-bezier(0.16, 1, 0.3, 1) both !important;
  box-shadow: none !important;
}

:root[data-cp-glow="off"] .cm-card-float:hover {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15) !important;
}

:root[data-cp-glow="off"] .cm-modal-panel {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15) !important;
}

:root[data-cp-glow="off"] .cm-card-glitch-line,
:root[data-cp-glow="off"] .cm-card-shine::before {
  display: none !important;
}

/* Reduce motion: disable looping animations, keep static layout */
@media (prefers-reduced-motion: reduce) {
  .cm-card-float,
  .cm-card-float[data-rarity],
  .cm-card-image,
  .cm-modal-panel,
  .cm-modal-backdrop,
  .cm-bg-grid-drift,
  .cm-card-glitch-line,
  .cm-card-shine::before {
    animation: none !important;
    transition: none !important;
  }
}
```

- [ ] **Step 2: Verify**

Toggle glow off in the running app. Item cards should retain layout but lose neon shadow + animations. Toggle back on; neon returns. Use macOS "Reduce motion" system pref to verify the media query path (or set with DevTools emulator).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "polish: glow-off overrides + prefers-reduced-motion guard for app-local FX"
```

---

## Task 4: Focus management for ItemPreviewDialog

**Files:**
- Modify: `components/item/ItemPreviewProvider.tsx`

The dialog already closes on Esc + backdrop click. Two improvements:
1. Focus the close button when the dialog opens
2. Return focus to the triggering ItemCard on close

- [ ] **Step 1: Track previously-focused element**

Update `ItemPreviewProvider` to capture the element that had focus when `open()` was called and restore on close.

```tsx
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// inside ItemPreviewProvider:
const triggerRef = useRef<HTMLElement | null>(null);

const open = useCallback((w: Weapon) => {
  triggerRef.current = (document.activeElement as HTMLElement | null) ?? null;
  setCurrent(w);
}, []);

const close = useCallback(() => {
  setCurrent(null);
  // restore focus next tick (after dialog unmounts)
  setTimeout(() => triggerRef.current?.focus({ preventScroll: true }), 0);
}, []);
```

In `ItemPreviewDialog`, focus the close button after mount:

```tsx
const closeBtnRef = useRef<HTMLButtonElement>(null);
useEffect(() => {
  closeBtnRef.current?.focus();
}, []);

// later, on the close button:
<button ref={closeBtnRef} type="button" aria-label="Close preview" onClick={onClose} ...>
```

- [ ] **Step 2: Type-check + manual verify**

```bash
npx tsc --noEmit
```

Open browser → tab to a card → press Enter → dialog opens, close button is focused → press Esc → focus returns to the card.

- [ ] **Step 3: Commit**

```bash
git add components/item/ItemPreviewProvider.tsx
git commit -m "a11y: focus management for item preview dialog (focus close on open, restore on close)"
```

---

## Task 5: Focus management for CartDrawer

**Files:**
- Modify: `components/cart/CartDrawer.tsx`

Same pattern as the dialog.

- [ ] **Step 1: Track + restore focus**

Add `useRef` for the trigger and the close button. The `CartDrawer` is opened from the Header / Cart icon — make those triggers callable so focus can return.

The simplest approach: in `CartDrawer.tsx`, accept the parent's `triggerRef` and focus the close button on open + restore on close. If the parent doesn't pass a ref, fall back to focusing the first item link in the drawer.

```tsx
import { useEffect, useRef } from "react";

export function CartDrawer({ open, onClose, triggerRef }: {
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      closeRef.current?.focus();
    }
    if (!open && wasOpen.current) {
      triggerRef?.current?.focus({ preventScroll: true });
    }
    wasOpen.current = open;
  }, [open, triggerRef]);

  // ... rest of component
  // <button ref={closeRef} onClick={onClose} aria-label="Close cart">✕</button>
}
```

- [ ] **Step 2: Esc-to-close**

Add a window key listener while `open`:

```tsx
useEffect(() => {
  if (!open) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [open, onClose]);
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add components/cart/CartDrawer.tsx
git commit -m "a11y: focus return + Esc-to-close on CartDrawer"
```

---

## Task 6: Common-tier text contrast pass

**Files:**
- Modify: `components/item/ItemCard.tsx` (or `RarityBadge.tsx` if applicable)

The `common` rarity uses `var(--cp-fg-muted)` (`#8a92a3`) on `var(--cp-bg)`. Verify it passes WCAG AA (≥ 4.5:1 for body text < 18px). If not, bump to `#a4adc2` or add `font-weight: 600`.

- [ ] **Step 1: Check contrast**

Use any contrast checker (WebAIM, browser DevTools "Inspect → Accessibility"). `#8a92a3` on `#04050b` measures around **6.4:1** which passes AA — but verify in your actual rendered build (theme tokens may differ slightly).

If the actual contrast is < 4.5:1 (some library tokens may resolve differently in v4), update RarityBadge for `common` to use `text-cp-fg-strong` or add a text-shadow:

```tsx
// RarityBadge.tsx — common case
const COMMON_FALLBACK = "rgba(255,255,255,0.85)";
// ... where rarity === "common":
return (
  <span
    className="cp-badge"
    style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(138,146,163,0.6)" }}
  >
    {RARITY_LABEL.common}
  </span>
);
```

Only apply this fallback if your contrast measurement actually failed — otherwise leave the existing `cp-badge cp-badge--fg-muted` chain in place.

- [ ] **Step 2: Commit (only if a fix was applied)**

```bash
git add components/item/RarityBadge.tsx
git commit -m "a11y: bump COMMON badge contrast to WCAG AA"
```

If no change was needed, skip this commit.

---

## Task 7: Keyboard navigation e2e

**Files:**
- Create: `e2e/a11y.spec.ts`

- [ ] **Step 1: Write test**

```ts
import { test, expect } from "@playwright/test";

test("keyboard navigation works across primary flows", async ({ page }) => {
  await page.goto("/browse");
  await expect(page.getByText(/40 weapons indexed/)).toBeVisible({ timeout: 10_000 });

  // Tab to filter search box
  await page.keyboard.press("Tab"); // brand link
  await page.keyboard.press("Tab"); // browse link
  await page.keyboard.press("Tab"); // orders
  await page.keyboard.press("Tab"); // seller
  await page.keyboard.press("Tab"); // cart link
  await page.keyboard.press("Tab"); // glow toggle
  await page.keyboard.press("Tab"); // wallet chip
  await page.keyboard.press("Tab"); // avatar
  // Now we should be in the main content. The first focusable inside the filter sidebar is search input.
  await page.keyboard.press("Tab"); // → search input
  await page.keyboard.type("mjolnir");
  await expect(page.getByText("MJOLNIR.exe")).toBeVisible({ timeout: 10_000 });

  // Tab into the result grid and press Enter on the card to open dialog
  // Use an explicit selector since tab order through filters is long
  await page.locator('button[aria-label="Preview MJOLNIR.exe"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/PROVENANCE/)).toBeVisible({ timeout: 5_000 });

  // Esc closes; focus returns to the trigger
  await page.keyboard.press("Escape");
  await expect(page.getByText(/PROVENANCE/)).not.toBeVisible({ timeout: 3_000 });
  // The trigger button should be focused again
  const focusedAria = await page.evaluate(() =>
    document.activeElement?.getAttribute("aria-label"),
  );
  expect(focusedAria).toBe("Preview MJOLNIR.exe");
});

test("glow toggle flips data-cp-glow attribute", async ({ page }) => {
  await page.goto("/");
  const initial = await page.evaluate(() => document.documentElement.getAttribute("data-cp-glow"));
  expect(initial === null || initial === "on").toBeTruthy();

  await page.getByRole("button", { name: /Glow effects/i }).click();
  const flipped = await page.evaluate(() => document.documentElement.getAttribute("data-cp-glow"));
  expect(flipped).toBe("off");

  // Reload — preference persists
  await page.reload();
  const afterReload = await page.evaluate(() => document.documentElement.getAttribute("data-cp-glow"));
  expect(afterReload).toBe("off");
});
```

- [ ] **Step 2: Run + commit**

```bash
npm run e2e -- e2e/a11y.spec.ts
git add e2e/a11y.spec.ts
git commit -m "test: keyboard navigation + glow-toggle persistence e2e"
```

---

## Task 8: Final manual checklist

**Files:**
- None (verification task)

- [ ] **Step 1: Run all gates locally**

```bash
npm test
npx tsc --noEmit
npm run build
npm run e2e
```

Expected: green across the board. Any 5%/8% simulated 503 hitting an e2e can be re-run once.

- [ ] **Step 2: Walk through each page in dev**

For each route, confirm the listed items render and don't show console errors:

- [ ] `/` — Hero with custom SVG + 4 stat tiles + Apex Spotlight + Trending + New Drops + Starter + CTA strip
- [ ] `/browse` — filter sidebar fully cyberpunk-styled, item grid stagger-animates in, mythic/legendary float, click card opens dialog
- [ ] `/browse/<slug>` — image, glitch heading, lore, 4 stat HUDs count up, gauge ring, related items, sticky add-to-cart bar
- [ ] `/cart` — table + sticky summary, qty stepper updates totals, remove works
- [ ] `/checkout` — 3-step flow, terminal animation, confirmation panel, links to /orders
- [ ] `/orders` — timeline, copy-tx-hash works, item thumbnails link to detail
- [ ] `/profile` — avatar, balance tile, inventory tab shows owned items
- [ ] `/seller` — stats bar + sales chart + listings table
- [ ] `/seller/new` — 4 steps with validation; publish lands on /seller and /browse?q=newslug

- [ ] **Step 3: Glow toggle smoke**

Toggle the ⚡ chip in header → background grids/glows mute, item card shadows neutral, heading neon flat. Reload → preference persists. Toggle back on → neon returns.

- [ ] **Step 4: Reduced motion smoke**

Enable system "Reduce motion" (macOS: System Settings → Accessibility → Display) or use DevTools → Rendering → Emulate CSS prefers-reduced-motion: reduce. Verify cards no longer stagger-animate or float, dialog no longer slides up. Layout still works.

- [ ] **Step 5: Document failures (if any)**

If any of the above fails, file a follow-up task in this plan and resolve before signing off.

---

## Task 9: README sweep

**Files:**
- Replace: `README.md`

- [ ] **Step 1: Final README**

```md
# NeonMarket — Cyber-Market

A cyberpunk × mythology marketplace UI demo. Year 2185. Mega-corps mine ancient relics and sell them as tech-weapons. Every weapon has custom SVG art; the marketplace is fully navigable end-to-end against an in-memory mock API.

## Stack

- **Next.js 15** (App Router · Turbopack) + **TypeScript**
- **Tailwind CSS v4** with `@rintran720/cyberpunk-ui` (CSS-only theme)
- **SWR** with optimistic mutations + 5% simulated `ICE_INTERFERENCE` errors
- In-memory mock API via Next.js Route Handlers (`/api/*`)
- 41 hand-rolled SVG illustrations (40 weapons + 1 hero scene)

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm test` — Vitest unit + integration tests
- `npm run e2e` — Playwright e2e suite

## Tour

| Route | What it shows |
|---|---|
| `/` | Hero with custom SVG scene · stats HUD · apex spotlight · trending · new drops · starter pack · seller CTA |
| `/browse` | 40 weapons in 5 sub-categories × 5 rarity tiers; full filter sidebar (search, category, rarity, price, sort, reset) with neon-styled checkboxes; click any card to open the preview dialog |
| `/browse/<slug>` | Full detail with stat HUDs, gauge-vs-median, related items rail, sticky add-to-cart |
| `/cart` | Cart table with qty steppers + sticky summary rail |
| `/checkout` | 3-step stepper · terminal typewriter sign-and-send · confirmation panel |
| `/orders` | Timeline of order history with copy-tx-hash |
| `/profile` | Avatar, balance tile, inventory tab listing owned weapons |
| `/seller` | Dashboard with revenue/sales/listings stats + 30-day SVG sales chart + listings table |
| `/seller/new` | 4-step create flow (category → media → price/stats → publish) with terminal mint animation |

## Visual system

- 5 rarity tiers: `common` (gray) · `rare` (green) · `epic` (purple) · `legendary` (yellow) · `unique` (1-of-1 magenta)
- Each item card lifts on hover with glow, light-sweep shine, reticle corners; legendary + unique tiers float continuously
- Dialog preview opens on card click with rarity-tinted neon border + corner-clip
- Glow toggle (⚡ chip in header) flips `data-cp-glow="off"` and persists in localStorage
- All animations honor `prefers-reduced-motion`

## Out-of-scope

This is a UI demo, not a production marketplace. There is no real auth, no real chain, no persistence beyond server runtime; restart resets state to the seed (40 weapons + 6 historical orders + 8 active listings + ⟁ 250K wallet for John Tran).
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: final README with full tour + visual-system notes"
```

---

## Definition of Done — Plan 5 (and the project)

1. ✅ GlowToggle works: clicking flips `data-cp-glow`, neon mutes, preference persists across reload
2. ✅ `prefers-reduced-motion` disables all app-local animations + transitions
3. ✅ `data-cp-glow="off"` neutralizes app-local glow shadows + decorative animations
4. ✅ ItemPreviewDialog returns focus to the triggering card on close
5. ✅ CartDrawer focuses close button on open, returns focus to trigger on close, Esc closes
6. ✅ Common-tier text contrast passes WCAG AA
7. ✅ Keyboard-only e2e passes
8. ✅ Glow-toggle persistence e2e passes
9. ✅ Manual walkthrough of all 9 routes is clean (no console errors, all key strings render)
10. ✅ `npm test`, `npm run e2e`, `npx tsc --noEmit`, `npm run build` all exit 0
11. ✅ README reflects final state

**Project Done** when this plan's DoD is checked AND each prior plan's DoD remains green.
