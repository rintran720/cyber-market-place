# NeonMarket — Cyber-Market

A cyberpunk × mythology marketplace UI demo. Year 2185. Mega-corps mine ancient relics and sell them as tech-weapons.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind v4
- `@rintran720/cyberpunk-ui` (CSS-only theme)
- SWR for client data fetching
- In-memory mock API via Next.js Route Handlers

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm test` — Vitest unit tests
- `npm run e2e` — Playwright smoke test

## Plan 1 tour (current scope)

- `/browse` — 40 mythological weapons across 5 sub-categories, 6 rarity tiers
- Filter by category / rarity / price / search; sort newest / price / rarity; paginate 24 / page
- Header shows hardcoded "John Tran" + ⟁ 250K placeholder balance (real wallet in Plan 3)

## Coming in later plans

- Plan 2: Home page + Item Detail page (HUD/radar/gauge)
- Plan 3: Cart, checkout, wallet, orders, profile
- Plan 4: Seller dashboard + 4-step create flow
- Plan 5: Glow toggle, animation polish, a11y audit
