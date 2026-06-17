# Leverage Decay Lab — SPEC.md

> Technical build specification for Claude Code. This document is self-contained —
> everything needed to build the project is here. Port the **math verbatim** from the
> reference implementation; do not re-derive it (it has been debugged carefully).

**Version:** 1.0
**Reference implementation:** `reference/legacy.html` (the working single-file prototype — commit it to the repo before Phase 1; it is the source of truth for math + zh-Hant copy)
**Date:** 2026-06-16

-----

## 1. Project Overview

An interactive, single-page explainer that shows — intuitively — **why a leveraged ETF (2x/3x) is usually a bad long-term hold**. The user picks a market scenario (choppy, up-but-volatile, crash, calm uptrend, Monte-Carlo random, textbook) and watches the leveraged ETF's net-asset value diverge from simply holding the index. The core lesson: a leveraged ETF tracks **daily** returns × L, not the period return × L, so **volatility decay** (worsening with σ², time, and L²) erodes it.

Audience: retail investors and a general Taiwanese audience (UI is **Traditional Chinese / zh-Hant**). It will be shared on social media and opened mostly on phones, so it must be **mobile-first, fast, and shareable**.

**Design goals (equal priority to correctness):**

1. **Easy to understand** — a live verdict banner states the bottom line in plain language, and the scenario picker sits up front so a newcomer can step through the "aha" scenarios themselves. (The earlier guided-overlay "story mode" was removed — see §8.6.)
1. **Interesting to play with** — animated path "race", instant feedback, shareable links to eye-opening configs.

**Key features**

- 7 scenarios, 2x/3x leverage, volatility/return slider, time horizon up to 3 years.
- Two-line net-value chart (index 1x vs leveraged Lx) with an animated draw + replay.
- Monte-Carlo scenario: 600 random paths → median ("typical outcome") line + faint distribution cloud + "% of paths that lose to just buying the index".
- Live KPIs and a plain-language **verdict banner**.
- Shareable URL state (scenario, σ, days, L encoded in query params).
- **Primary domain:** `leverage-decay-lab.vercel.app` (custom domain optional later)
- **Repo:** `github.com/8gara8/leverage-decay-lab`

-----

## 2. Stack

|Layer          |Choice                                                                                 |Why                                                                                                                                                                                                                |
|---------------|---------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|Build tool     |**Vite 5**                                                                             |No backend needed; this is a pure client-side SPA. Vite gives instant HMR, tiny static output, zero server runtime. Next.js would be dead weight here.                                                             |
|Framework      |**React 18 + TypeScript**                                                              |Componentizes the controls/chart/KPIs cleanly. TS makes the simulation math self-documenting and refactor-safe.                                                                                                    |
|Styling        |**Tailwind CSS v4** (CSS-first `@theme`) + CSS custom properties                       |Utility classes for layout speed; design tokens (the dark palette, accent colors) live in `@theme` so they're reusable and themeable.                                                                              |
|Charting       |**Custom `<canvas>`** (no chart lib)                                                   |The Monte-Carlo cloud is 50 polylines × up to 757 points; SVG libs (Recharts) choke on that. Canvas is fast and we already have working draw code to port. uPlot was considered but adds API surface we don't need.|
|State          |**`useReducer` + a `useSimState` hook** (no Zustand/Redux)                             |One screen, one state object. A reducer + URL sync is enough; avoid dependency bloat.                                                                                                                              |
|Animation      |**`requestAnimationFrame`** for the path race; CSS transitions for KPI/scenario changes|No animation library needed.                                                                                                                                                                                       |
|Testing        |**Vitest**                                                                             |Golden-number unit tests lock the simulation math so design refactors can't silently break it.                                                                                                                     |
|Hosting        |**Vercel** (static, auto-deploy from GitHub `main`)                                    |Zero-config for Vite, instant previews on PRs, free tier is plenty.                                                                                                                                                |
|Package manager|**pnpm**                                                                               |Fast, disk-efficient, matches deployment patterns.                                                                                                                                                                 |

**No backend, no database, no auth, no environment variables.** All computation is client-side and deterministic given the inputs. State that needs to persist (a shared config) lives in the URL.

### Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  }
}
```

-----

## 3. Repo Layout

```
leverage-decay-lab/
├── public/
│   └── og-image.png            # 1200×630 social preview (Phase 5)
├── reference/
│   └── legacy.html             # Working prototype — math + copy source of truth (read-only)
├── src/
│   ├── main.tsx                # React entry, mounts <App/>
│   ├── App.tsx                 # Top-level layout, owns sim state, wires components
│   ├── lib/
│   │   ├── sim.ts              # PURE simulation core: PRNG, scenario generators, buildPath, monteCarlo
│   │   ├── sim.test.ts         # Vitest golden tests (Phase 1 gate)
│   │   ├── scenarios.ts        # Scenario config map + slider semantics
│   │   ├── copy.ts             # zh-Hant strings: scenario titles, hints, narrative generators
│   │   ├── format.ts           # pct(), num() formatters
│   │   └── url.ts              # encode/decode state <-> URLSearchParams
│   ├── state/
│   │   └── useSimState.ts      # useReducer hook: state + actions + URL sync, returns memoized SimResult
│   ├── components/
│   │   ├── Hero.tsx            # Title, hook line, equation/intuition box
│   │   ├── Verdict.tsx         # Big live one-line verdict banner
│   │   ├── ScenarioCards.tsx   # Tappable scenario cards w/ mini sparkline preview
│   │   ├── Controls.tsx        # Leverage toggle, σ slider, days control, reshuffle
│   │   ├── Chart.tsx           # Canvas: index + leveraged lines, cloud, animation, baseline
│   │   ├── KpiGrid.tsx         # 4 KPI cards
│   │   ├── Kpi.tsx             # Single KPI card (count-up animated value)
│   │   ├── Narrative.tsx       # Result sentence + intuition callout
│   │   ├── DataTable.tsx       # First-days table (collapsible on mobile)
│   │   └── (StoryMode.tsx)     # Guided 3-step overlay — REMOVED, see §8.6
│   ├── hooks/
│   │   ├── useCountUp.ts       # Animates a number to a target
│   │   └── usePathAnimation.ts # Drives left-to-right reveal progress (0→1)
│   └── styles/
│       └── globals.css         # Tailwind import + @theme tokens + base styles
├── .github/workflows/ci.yml    # Lint + typecheck + test + build on push/PR
├── index.html                  # Vite HTML shell (lang="zh-Hant", meta/OG tags)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json                 # Security headers only
└── SPEC.md                     # This file
```

-----

## 4. Data Model (TypeScript types)

There is no database. These are the in-memory types in `src/lib/sim.ts` and `src/state`.

```typescript
// The seven scenarios.
type Scenario =
  | "choppyFlat"     // index ends ~flat, chop drags Lx down
  | "upChoppy"       // index up ~+10%/yr but volatile; Lx loses to index
  | "barelyBetter"   // index up ~+9%/yr; with σ≈30% the Lx ≈ index (not worth 2× risk)
  | "crash"          // crash then partial recovery; Lx far deeper drawdown
  | "calmUp"         // low-vol uptrend; Lx genuinely wins (honest counter-example)
  | "random"         // Monte-Carlo: 600 paths, show typical (median) + cloud
  | "textbook";      // idealized perfect alternation; down-day sized so 2x ends flat

type Leverage = 2 | 3;

// What the single slider means per scenario (its range + label).
interface ScenarioConfig {
  scenario: Scenario;
  swingName: string;      // zh-Hant label, e.g. "年化波動度 σ"
  unit: "%";
  min: number;
  max: number;
  step: number;
  def: number;            // default slider value
  hint: string;           // zh-Hant helper text
  showStart: boolean;     // textbook only: show 先漲後跌 / 先跌後漲 toggle
  showReshuffle: boolean; // random only: show 🎲 reshuffle
}

// User-controlled state (also the URL-shareable state).
interface SimState {
  scenario: Scenario;
  swing: number;          // slider value (meaning per ScenarioConfig)
  days: number;           // 2..756 (trading days; 252 = 1yr)
  L: Leverage;
  startsUp: boolean;      // textbook direction
  seed: number;           // random scenario reshuffle seed
}

// One point on a net-value path. Start point day=0 has idx=lev=100, moves=0.
interface PathPoint {
  day: number;
  idxMove: number;        // index daily return that day (0 at day 0)
  levMove: number;        // = L * idxMove
  idx: number;            // index net value (starts 100)
  lev: number;            // leveraged ETF net value (starts 100)
}

// Result for deterministic scenarios.
interface SimResult {
  points: PathPoint[];
  idxR: number;           // index total return (idx_final/100 - 1)
  levR: number;           // leveraged total return
  diff: number;           // levR - idxR  (>0 Lx beats index; <0 Lx loses)
  idxDD: number;          // index max drawdown (0..1)
  levDD: number;          // leveraged max drawdown (0..1)
  mc: null;               // not a Monte-Carlo result
}

// Result for the "random" scenario (Monte-Carlo).
interface MCResult {
  points: PathPoint[];    // the MEDIAN (typical) path, per-day median of idx & lev
  idxR: number;           // median index final return
  levR: number;           // median leveraged final return
  diff: number;
  idxDD: number;          // median of per-path index max drawdowns
  levDD: number;          // median of per-path leveraged max drawdowns
  mc: {
    cloud: number[][];    // ~50 individual leveraged net-value paths (length days+1)
    pBeat1x: number;      // fraction of paths where levR >= idxR (0..1)
    nPaths: number;       // 600
  };
}

type AnyResult = SimResult | MCResult;
```

**Validation rules**

- `days` clamped to `[2, 756]`.
- `swing` clamped to the active `ScenarioConfig` `[min, max]`; reset to `def` when scenario changes.
- `L ∈ {2, 3}` only.
- Leveraged daily factor is floored: `lev *= Math.max(1e-4, 1 + L*r)` (a fund can't go below 0).
- Monte-Carlo daily index return is clamped to `[-0.30, 0.30]` so `1 + L*r > 0` even at L=3.

-----

## 5. API Routes

**None.** This is a fully static client-side app. No server routes, no serverless functions, no env vars. If anyone proposes a backend, it's out of scope — every number is computed in the browser.

-----

## 6. Simulation Core — `src/lib/sim.ts` (port verbatim, then `sim.test.ts` must pass)

> This is the heart of the app and has been carefully debugged. Reproduce the formulas **exactly**. After writing it, the golden tests in §6.4 must pass before any UI work.

### 6.1 PRNG + Gaussian

```typescript
const SQ252 = Math.sqrt(252);

function mulberry32(a: number): () => number {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(rng: () => number): number {       // Box–Muller
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
```

### 6.2 Scenario return generators

All volatility is **annualized**; daily move `u = σ_annual / √252`. Each generator returns an array of `days` daily index returns.

```typescript
function genReturns(scenario, swing, days, startsUp): number[]
```

|scenario      |formula (swing = the slider value)                                                                                                                                                                           |
|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`choppyFlat`  |`u = (swing/100)/SQ252; down = u/(1+u);` then `r[i] = i%2===0 ? u : -down` (index returns to 100 each pair → ends flat)                                                                                      |
|`upChoppy`    |`u = (swing/100)/SQ252; total = 1.10**(days/252); g = total**(2/days); down = 1 - g/(1+u);` then `r[i] = i%2===0 ? u : -down` (index ≈ +10%/yr)                                                              |
|`barelyBetter`|same as `upChoppy` but base **1.09** (index ≈ +9%/yr; at σ≈30%, σ²≈μ so Lx ≈ index)                                                                                                                          |
|`crash`       |`depth = swing/100; half = floor(days/2); u = 0.35/SQ252;` `dn = (1-depth)**(1/half)-1; up = (1/(1-depth))**(1/(days-half))-1;` then `r[i] = (i<half ? dn : up) + (i%2===0 ? u : -u)` (trend + baked 35% vol)|
|`calmUp`      |`annual = swing/100; d = (1+annual)**(1/days)-1; u = 0.10/SQ252;` then `r[i] = d + (i%2===0 ? u : -u)` (baked 10% vol)                                                                                       |
|`textbook`    |`u = swing/100; dDown = (1 - (1+2*u)**-1)/2;` `up = startsUp ? i%2===0 : i%2===1;` `r[i] = up ? u : -dDown` (down-day sized so 2x ends flat)                                                                 |
|`random`      |handled by `monteCarlo()` — not `genReturns`                                                                                                                                                                 |

> **Port note (scaffold, reviewer P2, user-approved):** `calmUp`'s daily drift is
> implemented as `d = (1+annual)**(1/252)-1` instead of the literal `**(1/days)`.
> The slider is an *annualized* gain (§7 "年化漲幅"); the literal form spreads the
> total return across the whole sim, so a 12% setting yields only ~+12% even over
> 3 years and understates the honest leverage-wins counter-example (§8.9). The
> `**(1/252)` form is identical at 252d (golden test unaffected) and compounds per
> trading year beyond it. The odd-horizon pairing quirk Codex also flagged (a
> "flat" scenario ending slightly up when `days` is odd) is left **as the verbatim
> SPEC formula**, to revisit against `reference/legacy.html` in Phase 2.

### 6.3 buildPath, drawdown, Monte-Carlo

```typescript
function buildPath(returns: number[], L: number): PathPoint[] {
  const pts = [{ day:0, idxMove:0, levMove:0, idx:100, lev:100 }];
  let idx = 100, lev = 100;
  returns.forEach((r, i) => {
    idx *= (1 + r);
    lev *= Math.max(1e-4, 1 + L * r);
    pts.push({ day:i+1, idxMove:r, levMove:L*r, idx, lev });
  });
  return pts;
}

function maxDrawdown(points: PathPoint[], key: "idx" | "lev"): number {
  let peak = points[0][key], m = 0;
  for (const p of points) { if (p[key] > peak) peak = p[key]; m = Math.max(m, (peak - p[key]) / peak); }
  return m;
}

// O(N) quickselect (used for per-day medians; do NOT full-sort every day)
function selectK(arr: number[], k: number): number { /* standard Hoare quickselect, in-place */ }

function monteCarlo(sigma, days, L, seed): MCResult {
  const N = 600, MID = N >> 1, md = 0.06/252, sd = sigma/SQ252; // ~+6%/yr drift
  // For each of N paths: simulate idx & lev arrays with r = clamp(md + sd*gauss, -0.30, 0.30).
  //   seed each path: mulberry32(((seed ^ 0x9e3779b9) * 2654435761 + k*40503) >>> 0)
  //   record per-path idxR, levR, maxDD(idx), maxDD(lev); beat1x++ if levR >= idxR
  // Median path: for each day i, selectK over the N idx values and N lev values → median idx/lev.
  //   Build PathPoint[] from those medians (idxMove/levMove = day-over-day ratio of medians).
  // cloud: subsample every floor(N/50) lev paths (~50 arrays).
  // medIdxDD/medLevDD: selectK over the N per-path drawdowns.
  // pBeat1x = beat1x / N.
  // MEMOIZE by `${sigma}|${days}|${L}|${seed}` so resize/redraw doesn't recompute.
}
```

> **Port note (scaffold):** SPEC §6.3's `sd = sigma/SQ252` is shorthand. The
> §6.4 golden test calls `monteCarlo(σ=30, …)` and §7's slider feeds the function
> the percent slider value (default 30), exactly like `genReturns`' `swing/100`.
> So the implementation uses `sd = (sigma/100)/SQ252`; without the `/100` daily
> vol explodes and every path crashes to ~0 (pBeat1x = 0). The golden test
> `pBeat1x ∈ [0.30, 0.50]` confirms the `/100` form.

**Performance:** with quickselect, the 3-year × 3x case is ~60 ms. Memoize so only an actual input change recomputes. (Phase 4 moves this into a Web Worker so slider drags never block paint.)

### 6.4 Golden tests — `src/lib/sim.test.ts` (must pass before UI work)

Assert with a tolerance of ±0.5 percentage points unless noted:

|test               |input                                               |assert                                           |
|-------------------|----------------------------------------------------|-------------------------------------------------|
|choppy flat 2x     |choppyFlat σ=40, 252d, L=2                          |`idxR ≈ 0.000`; `levR ≈ -0.145`                  |
|choppy flat 3x     |choppyFlat σ=40, 252d, L=3                          |`levR ≈ -0.374` (decay scales ~L²)               |
|decay grows w/ time|choppyFlat σ=40, L=2 at 21/126/252d                 |gap `idxR - levR` widens with horizon            |
|up but choppy      |upChoppy σ=50, 252d, L=2                            |`idxR ≈ +0.10`; `levR < idxR` and `levR < 0`     |
|barely better      |barelyBetter σ=30, 252d, L=2                        |`idxR ≈ +0.09`; `levR ≈ idxR`                    |
|crash drawdown     |crash depth=35, 252d, L=2                           |`levDD > idxDD`; `levDD ≈ 0.64`; `levR < -0.10`  |
|calm uptrend       |calmUp annual=12, 252d, L=2                         |`levR > idxR` and `levR > 0` (leverage wins)     |
|textbook flat 2x   |textbook u=3, 252d, L=2                             |`idxR ≈ +0.113`; `levR ≈ 0.000`                  |
|MC typical loses   |monteCarlo σ=30, 252d, L=2, seed=7                  |median `levR < idxR`; `pBeat1x` in `[0.30, 0.50]`|
|no NaN sweep       |every scenario × {L2,L3} × {2d,756d} × extreme swing|all outputs finite                               |

-----

## 7. Scenario Config & Copy

`src/lib/scenarios.ts` exports `CONFIG: Record<Scenario, ScenarioConfig>`. Values (port from `reference/legacy.html`):

|scenario    |swingName|min/max/step/def |start  |reshuffle|
|------------|---------|-----------------|-------|---------|
|choppyFlat  |年化波動度 σ  |10 / 80 / 5 / 40 |no     |no       |
|upChoppy    |年化波動度 σ  |10 / 80 / 5 / 50 |no     |no       |
|barelyBetter|年化波動度 σ  |15 / 45 / 5 / 30 |no     |no       |
|crash       |崩盤深度     |10 / 60 / 5 / 35 |no     |no       |
|calmUp      |年化漲幅     |4 / 25 / 1 / 12  |no     |no       |
|random      |年化波動度 σ  |10 / 80 / 5 / 30 |no     |**yes**  |
|textbook    |上漲日漲幅 u  |0.5 / 8 / 0.5 / 3|**yes**|no       |

`src/lib/copy.ts` exports the zh-Hant scenario titles, subtitles, hints, and two **narrative generators**: `resultSentence(state, result)` and `intuition(state, result)` returning `{ cls: "red"|"green", html: string }`. **Port the exact wording from `reference/legacy.html`** (§ result-sentence / intuition blocks), then lightly adapt only where §8 changes the layout. Keep the "ETF vs 大盤" framing — the prototype already removed the "天真期望/naive expectation" concept; do **not** reintroduce it.

Verdict line (`Verdict.tsx`) is derived live from `result.diff`:

- `diff < 0` → red: `「在這個情境下，買 2x ETF 反而少賺 X% —— 不如直接買大盤」`
- `diff ≥ 0` → green: `「這個情境下槓桿多賺 X%，但你扛了兩倍波動」`
  (substitute `L` and the live numbers).

-----

## 8. Design Direction (build the improved version, not a 1:1 port)

The prototype is the functional baseline. The rebuild keeps the math but levels up UX. Build these:

**8.1 Layout — mobile-first, single column on phones.**
Stack order on mobile: Hero → Verdict banner → Chart → KPI grid (2×2) → Scenario cards → Controls → Narrative → (collapsible) table. On ≥1024px, two columns: left = scenario cards + controls (sticky), right = verdict + chart + KPIs + narrative. Sliders and cards must be touch-friendly (≥44px targets).

**8.2 Verdict banner (`Verdict.tsx`).**
A full-width, color-coded one-liner directly under the hero that restates the bottom line in plain language and updates live. This is the single most important "easy to understand" element — the takeaway should be readable in 2 seconds without parsing a chart.

**8.3 Scenario cards with sparkline preview (`ScenarioCards.tsx`).**
Replace the plain buttons with cards. Each card shows its zh-Hant title, one-line subtitle, and a **tiny inline sparkline** (precomputed at that scenario's default settings, ~40×24px canvas or inline SVG) showing the index vs leveraged shape. At a glance the user sees "this one ends with red far below blue" before clicking. Active card highlighted.

**8.4 Animated path "race" (`Chart.tsx` + `usePathAnimation.ts`).**
On scenario/param change, animate the two lines drawing left-to-right over ~900ms (ease-out), so the divergence *happens* in front of the user rather than appearing static. A small **▶︎ 重播 (replay)** button re-runs the animation. The Monte-Carlo cloud fades in (opacity 0→1) after the median lines finish. Respect `prefers-reduced-motion` (skip to final frame).

**8.5 KPI count-up (`Kpi.tsx` + `useCountUp.ts`).**
KPI values animate from their previous number to the new target (~400ms) so changes feel responsive. Four KPIs: 大盤(1x)報酬 · Lx ETF報酬 · 「和直接買大盤相比」(diff, the highlighted card) · Lx 途中最大跌幅 (with 大盤 sub).

**8.6 Story mode (`StoryMode.tsx`) — REMOVED (2026-06-17, product decision).**
Originally a 3-step guided overlay (「教學模式」) that auto-set scenarios for
first-time visitors. Dropped because the audience is adults (retail investors)
and the "tutorial mode" framing read as patronising. The component, its hero
re-open button, and the `STORY_STEPS` copy were deleted. The newcomer on-ramp is
now the always-on verdict banner (§8.2) plus the scenario picker, which on mobile
sits directly under the hero (above the chart) so choosing a scenario is the
first action (§8.1). The original 3 "aha" scenarios remain reachable as ordinary
cards: 震盪盤整 → 上漲卻震盪 → 平穩上漲.

**8.7 Shareable URL (`url.ts` + `useSimState.ts`).**
Encode `SimState` into query params (`?s=choppyFlat&sig=40&d=252&L=2`) and update on change via `history.replaceState`. On load, hydrate state from the URL. Add a 「🔗 複製連結」 button. This makes a striking config one tap to share — key for the social-media goal.

**8.8 Visual system (`globals.css` `@theme`).**
Carry over the prototype's dark palette as tokens: background deep navy with subtle radial accent glows; `--accent` blue (#60a5fa) = index 1x; `--accent-2` red (#f87171) = leveraged; amber baseline at 100; green/red for good/bad. Cards: rounded-2xl, 1px hairline borders, soft shadows. Type: system UI stack with Noto Sans TC / PingFang TC fallback. Generous spacing, restrained use of bold. Keep it feeling like a polished "lab", not a spreadsheet. Reference `frontend-design` skill conventions; avoid templated defaults.

**8.9 Honesty guardrails (keep these from the prototype).**

- Always draw the 1x index as the comparison baseline.
- Keep `calmUp` as a genuine counter-example where leverage wins.
- A small "這個模型忽略了什麼？" disclosure noting fees/borrowing cost/tracking error make reality worse.

-----

## 9. Components — props

```typescript
// Chart.tsx
interface ChartProps {
  points: PathPoint[];          // index + leveraged (median for MC)
  cloud?: number[][];           // MC distribution paths (faint)
  L: Leverage;
  progress: number;             // 0..1 animation reveal
}

// KpiGrid.tsx / Kpi.tsx
interface KpiGridProps { result: AnyResult; L: Leverage; isMC: boolean; }
interface KpiProps {
  label: string; value: number; format: "pct" | "pctAbs";
  tone: "good" | "bad" | "warn" | "neutral"; sub?: string; highlight?: boolean;
}

// ScenarioCards.tsx
interface ScenarioCardsProps { active: Scenario; onSelect: (s: Scenario) => void; }

// Controls.tsx
interface ControlsProps {
  state: SimState; config: ScenarioConfig;
  onChange: (patch: Partial<SimState>) => void;   // dispatches reducer actions
}

// Verdict.tsx
interface VerdictProps { diff: number; L: Leverage; }

// Narrative.tsx
interface NarrativeProps { state: SimState; result: AnyResult; }
```

`useSimState()` returns `{ state, config, result, set, reshuffle, replayKey }` where `result: AnyResult` is `useMemo`'d on `state`, and `set(patch)` updates state + URL. Switching scenario resets `swing` to the new `config.def` and clamps `days`.

All components are pure presentational except `Chart` (owns its canvas + RAF loop) and `App`/`useSimState` (own state).

-----

## 10. Build Scripts & package.json

No data preprocessing. Standard Vite pipeline plus tests.

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc -b --noEmit",
    "lint": "tsc -b --noEmit"
  }
}
```

`vite.config.ts`: React plugin + Tailwind v4 Vite plugin. Output default `dist/`.

-----

## 11. Deployment — Vercel + GitHub

**Pattern:** push to `main` → Vercel auto-builds and deploys. No env vars.

1. Create the GitHub repo, push the scaffold.
1. Import the repo in Vercel. Framework preset: **Vite** (auto-detected). Build command `pnpm build`, output `dist`. Install command `pnpm install`.
1. Production URL `leverage-decay-lab.vercel.app`; add a custom domain later via Vercel → Settings → Domains.

`vercel.json` (security headers only — Vite SPA needs no rewrites since it's a single page):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

> Note: `X-Frame-Options: SAMEORIGIN` (not DENY) so the page can still be embedded if you later want an iframe demo on your own sites. Drop to DENY if not needed.

**CI — `.github/workflows/ci.yml`** (checks on PRs; Vercel handles deploy):

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

-----

## 12. Phased Build Plan

Each phase ends with something runnable and a clear checkpoint.

### Phase 0 — Scaffold & deploy hello-world

1. `pnpm create vite@latest` (React + TS), add Tailwind v4 (`@tailwindcss/vite`), set `index.html` `lang="zh-Hant"` + title + meta description.
1. Commit `reference/legacy.html`. Add `globals.css` with `@theme` tokens from §8.8.
1. Push to GitHub, import to Vercel.
   **Milestone:** a deployed Vercel URL renders a styled placeholder.

### Phase 1 — Simulation core + golden tests (math gate)

1. Implement `src/lib/sim.ts` exactly per §6 (PRNG, `genReturns`, `buildPath`, `maxDrawdown`, `selectK`, `monteCarlo` with memoization).
1. Implement `src/lib/scenarios.ts` (§7 table) and `format.ts`.
1. Write `src/lib/sim.test.ts` (§6.4) and make all tests pass.
   **Milestone:** `pnpm test` green; the math is locked.

### Phase 2 — Functional sandbox (parity with prototype)

1. `useSimState` hook (reducer + memoized result; no URL yet).
1. `Chart.tsx` (static draw: baseline 100, index line, leveraged line, MC cloud + median). `KpiGrid`/`Kpi` (no count-up yet). `Controls` (leverage, slider, days slider + quick buttons 1月/半年/1年/3年, reshuffle, textbook direction). Plain scenario buttons. `Narrative` (port copy from `copy.ts`).
1. Responsive layout (§8.1).
   **Milestone:** every scenario works on desktop + mobile; deployed. Functionally equals the prototype.

### Phase 3 — Design upgrades

1. `Verdict.tsx` banner (§8.2). 2. `ScenarioCards.tsx` with sparkline previews (§8.3). 3. KPI count-up (§8.5). 4. Scenario-change CSS transitions. 5. ~~`StoryMode.tsx` guided walkthrough (§8.6)~~ — built in Phase 3, later removed (§8.6).
   **Milestone:** newcomer can understand the lesson without touching a control; looks polished.

### Phase 4 — Engagement & performance

1. `usePathAnimation` + animated path race + replay button + cloud fade-in (§8.4), honoring `prefers-reduced-motion`.
1. `url.ts` + URL state sync + 「複製連結」 button (§8.7).
1. Move `monteCarlo` into `src/workers/mc.worker.ts`; `useSimState` posts params (debounced ~80ms) and receives results, so slider drags never block paint. Keep the synchronous version as a fallback for SSR/tests.
   **Milestone:** shareable links restore exact state; slider drags are buttery; the race animation reads clearly.

### Phase 5 — Share polish (optional)

1. `public/og-image.png` + OG/Twitter meta tags in `index.html`.
1. Optional EN/中文 language toggle (extract strings to `copy.ts` keyed by locale; zh-Hant default).
1. "Key takeaways" footer: 波動越大越糟 · 時間越長越糟 · 槓桿越高越糟 · 適合短打、不適合長抱.
   **Milestone:** sharing a link shows a rich preview; reads well in both languages.

-----

## 13. Notes for Claude Code

- **Do not re-derive the math.** Port §6 verbatim; the golden tests in §6.4 are the contract. If a test fails, the port is wrong — fix the port, not the test.
- **Keep it dependency-light.** No chart library, no state library, no UI kit. The whole app should ship a small bundle.
- **zh-Hant is the product language.** All user-facing copy is Traditional Chinese; keep code/comments in English.
- **`reference/legacy.html` is authoritative** for any wording, formula, or behavior this spec leaves ambiguous.
