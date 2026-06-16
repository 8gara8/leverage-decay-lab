# Leverage Decay Lab · 槓桿衰減實驗室

An interactive, mobile-first explainer for **why a leveraged ETF (2x/3x) is
usually a bad long-term hold**. Pick a market scenario and watch the leveraged
fund's net value diverge from simply holding the index — the core lesson being
that a leveraged ETF tracks **daily** returns × L, so **volatility decay** erodes
it (worse with σ², time, and L²).

UI language is **Traditional Chinese (zh-Hant)**. Pure client-side SPA — no
backend, no database, no env vars.

See [`SPEC.md`](./SPEC.md) for the full build specification.

## Stack

Vite 5 · React 18 + TypeScript · Tailwind CSS v4 · custom `<canvas>` charting ·
`useReducer` state · Vitest · deployed on Vercel.

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # golden simulation tests (the math gate)
pnpm build      # typecheck + production build -> dist/
```

## Project status

- **Phase 0 — Scaffold:** ✅ Vite + React + TS + Tailwind v4, deploy-ready, CI.
- **Phase 1 — Simulation core + golden tests:** ✅ `src/lib/sim.ts` ported
  verbatim from `SPEC.md §6`; `src/lib/sim.test.ts` (§6.4) green.
- **Phase 2+ — Sandbox, design, animation, sharing:** in progress.

## Layout

```
src/lib/sim.ts         PURE simulation core (PRNG, scenarios, buildPath, monteCarlo)
src/lib/sim.test.ts    Golden tests — the math contract (SPEC.md §6.4)
src/lib/scenarios.ts   Scenario config map + slider semantics (SPEC.md §7)
src/lib/format.ts      pct() / num() formatters
src/styles/globals.css Tailwind import + @theme design tokens (SPEC.md §8.8)
```

> `reference/legacy.html` (the original prototype, documented source of truth)
> was not provided to the scaffold step — see [`reference/README.md`](./reference/README.md).
> The math was ported directly from `SPEC.md §6` and locked by the golden tests.
