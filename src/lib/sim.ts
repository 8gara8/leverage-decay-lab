// Simulation core for Leverage Decay Lab.
//
// Ported VERBATIM from SPEC.md §6. The formulas have been carefully debugged in
// the reference prototype — do not re-derive them. The golden tests in
// `sim.test.ts` (SPEC.md §6.4) are the contract: if a test fails, the port is
// wrong, fix the port, not the test.

// ----------------------------------------------------------------------------
// Types (SPEC.md §4)
// ----------------------------------------------------------------------------

export type Scenario =
  | 'choppyFlat' // index ends ~flat, chop drags Lx down
  | 'upChoppy' // index up ~+10%/yr but volatile; Lx loses to index
  | 'barelyBetter' // index up ~+9%/yr; with σ≈30% the Lx ≈ index (not worth 2× risk)
  | 'crash' // crash then partial recovery; Lx far deeper drawdown
  | 'calmUp' // low-vol uptrend; Lx genuinely wins (honest counter-example)
  | 'random' // Monte-Carlo: 600 paths, show typical (median) + cloud
  | 'textbook' // idealized perfect alternation; down-day sized so 2x ends flat

export type Leverage = 2 | 3

export interface PathPoint {
  day: number
  idxMove: number // index daily return that day (0 at day 0)
  levMove: number // = L * idxMove
  idx: number // index net value (starts 100)
  lev: number // leveraged ETF net value (starts 100)
}

export interface SimResult {
  points: PathPoint[]
  idxR: number // index total return (idx_final/100 - 1)
  levR: number // leveraged total return
  diff: number // levR - idxR  (>0 Lx beats index; <0 Lx loses)
  idxDD: number // index max drawdown (0..1)
  levDD: number // leveraged max drawdown (0..1)
  mc: null // not a Monte-Carlo result
}

export interface MCResult {
  points: PathPoint[] // the MEDIAN (typical) path, per-day median of idx & lev
  idxR: number // median index final return
  levR: number // median leveraged final return
  diff: number
  idxDD: number // median of per-path index max drawdowns
  levDD: number // median of per-path leveraged max drawdowns
  mc: {
    cloud: number[][] // ~50 individual leveraged net-value paths (length days+1)
    pBeat1x: number // fraction of paths where levR >= idxR (0..1)
    nPaths: number // 600
  }
}

export type AnyResult = SimResult | MCResult

// ----------------------------------------------------------------------------
// §6.1 PRNG + Gaussian
// ----------------------------------------------------------------------------

const SQ252 = Math.sqrt(252)

function mulberry32(a: number): () => number {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gauss(rng: () => number): number {
  // Box–Muller
  let u = 0,
    v = 0
  while (u === 0) u = rng()
  while (v === 0) v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// ----------------------------------------------------------------------------
// §6.2 Scenario return generators
// ----------------------------------------------------------------------------

// All volatility is annualized; daily move u = σ_annual / √252.
// Returns an array of `days` daily index returns.
export function genReturns(
  scenario: Scenario,
  swing: number,
  days: number,
  startsUp: boolean,
): number[] {
  const r: number[] = new Array(days)

  switch (scenario) {
    case 'choppyFlat': {
      const u = swing / 100 / SQ252
      const down = u / (1 + u)
      for (let i = 0; i < days; i++) r[i] = i % 2 === 0 ? u : -down
      return r
    }
    case 'upChoppy': {
      const u = swing / 100 / SQ252
      const total = 1.1 ** (days / 252)
      const g = total ** (2 / days)
      const down = 1 - g / (1 + u)
      for (let i = 0; i < days; i++) r[i] = i % 2 === 0 ? u : -down
      return r
    }
    case 'barelyBetter': {
      const u = swing / 100 / SQ252
      const total = 1.09 ** (days / 252)
      const g = total ** (2 / days)
      const down = 1 - g / (1 + u)
      for (let i = 0; i < days; i++) r[i] = i % 2 === 0 ? u : -down
      return r
    }
    case 'crash': {
      const depth = swing / 100
      const half = Math.floor(days / 2)
      const u = 0.35 / SQ252
      const dn = (1 - depth) ** (1 / half) - 1
      const up = (1 / (1 - depth)) ** (1 / (days - half)) - 1
      for (let i = 0; i < days; i++)
        r[i] = (i < half ? dn : up) + (i % 2 === 0 ? u : -u)
      return r
    }
    case 'calmUp': {
      const annual = swing / 100
      // Daily drift based on a TRADING YEAR so the slider's "年化漲幅" compounds
      // per year across any horizon. SPEC §6.2 wrote `(1+annual)**(1/days)-1`,
      // which spreads the total across the whole sim (e.g. only ~+12% over 3
      // years); that understated the honest leverage-wins counter-example (§8.9)
      // at long horizons. `**(1/252)` is identical at 252d (golden test holds)
      // and compounds correctly beyond it. (Reviewer P2; user-approved deviation.)
      const d = (1 + annual) ** (1 / 252) - 1
      const u = 0.1 / SQ252
      for (let i = 0; i < days; i++) r[i] = d + (i % 2 === 0 ? u : -u)
      return r
    }
    case 'textbook': {
      const u = swing / 100
      const dDown = (1 - (1 + 2 * u) ** -1) / 2
      for (let i = 0; i < days; i++) {
        const up = startsUp ? i % 2 === 0 : i % 2 === 1
        r[i] = up ? u : -dDown
      }
      return r
    }
    case 'random':
      // handled by monteCarlo() — not genReturns
      throw new Error('genReturns: "random" is handled by monteCarlo()')
  }
}

// ----------------------------------------------------------------------------
// §6.3 buildPath, drawdown, Monte-Carlo
// ----------------------------------------------------------------------------

export function buildPath(returns: number[], L: number): PathPoint[] {
  const pts: PathPoint[] = [{ day: 0, idxMove: 0, levMove: 0, idx: 100, lev: 100 }]
  let idx = 100,
    lev = 100
  returns.forEach((r, i) => {
    idx *= 1 + r
    lev *= Math.max(1e-4, 1 + L * r)
    pts.push({ day: i + 1, idxMove: r, levMove: L * r, idx, lev })
  })
  return pts
}

export function maxDrawdown(points: PathPoint[], key: 'idx' | 'lev'): number {
  let peak = points[0][key],
    m = 0
  for (const p of points) {
    if (p[key] > peak) peak = p[key]
    m = Math.max(m, (peak - p[key]) / peak)
  }
  return m
}

// Max drawdown over a plain numeric net-value series (used inside Monte-Carlo).
function maxDrawdownSeries(series: number[]): number {
  let peak = series[0],
    m = 0
  for (const v of series) {
    if (v > peak) peak = v
    m = Math.max(m, (peak - v) / peak)
  }
  return m
}

// O(N) quickselect — returns the k-th smallest element (0-based). In-place.
export function selectK(arr: number[], k: number): number {
  let lo = 0,
    hi = arr.length - 1
  while (lo < hi) {
    const pivot = arr[(lo + hi) >> 1]
    let i = lo,
      j = hi
    while (i <= j) {
      while (arr[i] < pivot) i++
      while (arr[j] > pivot) j--
      if (i <= j) {
        const tmp = arr[i]
        arr[i] = arr[j]
        arr[j] = tmp
        i++
        j--
      }
    }
    if (k <= j) hi = j
    else if (k >= i) lo = i
    else break
  }
  return arr[k]
}

// ----------------------------------------------------------------------------
// Monte-Carlo (SPEC.md §6.3) with memoization
// ----------------------------------------------------------------------------

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x
}

const mcCache = new Map<string, MCResult>()

export function monteCarlo(
  sigma: number,
  days: number,
  L: number,
  seed: number,
): MCResult {
  const cacheKey = `${sigma}|${days}|${L}|${seed}`
  const cached = mcCache.get(cacheKey)
  if (cached) return cached

  const N = 600
  const MID = N >> 1
  const md = 0.06 / 252 // ~+6%/yr drift
  // `sigma` arrives as an annualized percent (slider value, e.g. 30 = 30%),
  // matching genReturns' `swing/100` convention. SPEC §6.3 wrote `sigma/SQ252`
  // as shorthand, but §6.4's test (σ=30) and §7's slider semantics require the
  // /100 — without it daily vol blows up and every path crashes to zero.
  const sd = sigma / 100 / SQ252

  const len = days + 1
  // idxMatrix[k] / levMatrix[k] are net-value series for path k (length days+1).
  const idxMatrix: number[][] = new Array(N)
  const levMatrix: number[][] = new Array(N)
  const idxRArr = new Array<number>(N)
  const levRArr = new Array<number>(N)
  const idxDDArr = new Array<number>(N)
  const levDDArr = new Array<number>(N)
  let beat1x = 0

  for (let k = 0; k < N; k++) {
    const rng = mulberry32(((seed ^ 0x9e3779b9) * 2654435761 + k * 40503) >>> 0)
    const idxArr = new Array<number>(len)
    const levArr = new Array<number>(len)
    let idx = 100,
      lev = 100
    idxArr[0] = 100
    levArr[0] = 100
    for (let i = 0; i < days; i++) {
      const r = clamp(md + sd * gauss(rng), -0.3, 0.3)
      idx *= 1 + r
      lev *= Math.max(1e-4, 1 + L * r)
      idxArr[i + 1] = idx
      levArr[i + 1] = lev
    }
    idxMatrix[k] = idxArr
    levMatrix[k] = levArr
    const ir = idx / 100 - 1
    const lr = lev / 100 - 1
    idxRArr[k] = ir
    levRArr[k] = lr
    idxDDArr[k] = maxDrawdownSeries(idxArr)
    levDDArr[k] = maxDrawdownSeries(levArr)
    if (lr >= ir) beat1x++
  }

  // Median path: per-day median of idx & lev across the N paths.
  const points: PathPoint[] = new Array(len)
  const colIdx = new Array<number>(N)
  const colLev = new Array<number>(N)
  let prevIdx = 100,
    prevLev = 100
  for (let i = 0; i < len; i++) {
    for (let k = 0; k < N; k++) {
      colIdx[k] = idxMatrix[k][i]
      colLev[k] = levMatrix[k][i]
    }
    const mIdx = selectK(colIdx, MID)
    const mLev = selectK(colLev, MID)
    if (i === 0) {
      points[i] = { day: 0, idxMove: 0, levMove: 0, idx: mIdx, lev: mLev }
    } else {
      points[i] = {
        day: i,
        idxMove: mIdx / prevIdx - 1,
        levMove: mLev / prevLev - 1,
        idx: mIdx,
        lev: mLev,
      }
    }
    prevIdx = mIdx
    prevLev = mLev
  }

  // cloud: subsample every floor(N/50) lev paths (~50 arrays).
  const stride = Math.max(1, Math.floor(N / 50))
  const cloud: number[][] = []
  for (let k = 0; k < N; k += stride) cloud.push(levMatrix[k])

  const medIdxDD = selectK(idxDDArr, MID)
  const medLevDD = selectK(levDDArr, MID)

  const result: MCResult = {
    points,
    idxR: points[len - 1].idx / 100 - 1,
    levR: points[len - 1].lev / 100 - 1,
    diff: points[len - 1].lev / 100 - points[len - 1].idx / 100,
    idxDD: medIdxDD,
    levDD: medLevDD,
    mc: {
      cloud,
      pBeat1x: beat1x / N,
      nPaths: N,
    },
  }

  mcCache.set(cacheKey, result)
  return result
}

// ----------------------------------------------------------------------------
// Top-level driver
// ----------------------------------------------------------------------------

export interface SimInputs {
  scenario: Scenario
  swing: number
  days: number
  L: Leverage
  startsUp: boolean
  seed: number
}

// User-controlled, URL-shareable state (SPEC.md §4). Structurally identical to
// simulate()'s input, so the two stay in lockstep.
export type SimState = SimInputs

export function simulate(inputs: SimInputs): AnyResult {
  const { scenario, swing, days, L, startsUp, seed } = inputs

  if (scenario === 'random') {
    return monteCarlo(swing, days, L, seed)
  }

  const returns = genReturns(scenario, swing, days, startsUp)
  const points = buildPath(returns, L)
  const last = points[points.length - 1]
  const idxR = last.idx / 100 - 1
  const levR = last.lev / 100 - 1
  return {
    points,
    idxR,
    levR,
    diff: levR - idxR,
    idxDD: maxDrawdown(points, 'idx'),
    levDD: maxDrawdown(points, 'lev'),
    mc: null,
  }
}
