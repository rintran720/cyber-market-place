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
