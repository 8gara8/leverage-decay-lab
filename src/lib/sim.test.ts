// Golden tests — SPEC.md §6.4. These lock the simulation math.
// If a test fails, the PORT is wrong; fix sim.ts, not the test.

import { describe, it, expect } from 'vitest'
import {
  genReturns,
  buildPath,
  maxDrawdown,
  monteCarlo,
  simulate,
  type Scenario,
  type Leverage,
} from './sim'
import { CONFIG, SCENARIO_ORDER } from './scenarios'

// Tolerance: ±0.5 percentage points unless noted.
const TOL = 0.005

function det(scenario: Scenario, swing: number, days: number, L: Leverage, startsUp = false) {
  const pts = buildPath(genReturns(scenario, swing, days, startsUp), L)
  const last = pts[pts.length - 1]
  return {
    pts,
    idxR: last.idx / 100 - 1,
    levR: last.lev / 100 - 1,
    idxDD: maxDrawdown(pts, 'idx'),
    levDD: maxDrawdown(pts, 'lev'),
  }
}

describe('choppyFlat — volatility decay', () => {
  it('choppy flat 2x: idxR ≈ 0.000, levR ≈ -0.145', () => {
    const r = det('choppyFlat', 40, 252, 2)
    expect(r.idxR).toBeCloseTo(0.0, 2)
    expect(Math.abs(r.levR - -0.145)).toBeLessThan(TOL)
  })

  it('choppy flat 3x: levR ≈ -0.374 (decay scales ~L²)', () => {
    const r = det('choppyFlat', 40, 252, 3)
    expect(Math.abs(r.levR - -0.374)).toBeLessThan(TOL)
  })

  it('decay grows with time (gap idxR - levR widens 21 < 126 < 252 days)', () => {
    // SPEC §6.4's exact assertion cell was truncated by the markdown table; the
    // documented intent is "decay grows w/ time". The honest, horizon-robust
    // measure is the volatility-decay gap (how far Lx falls behind the index),
    // which widens monotonically: ~ -0.012 -> 0.075 -> 0.145.
    const a = det('choppyFlat', 40, 21, 2)
    const b = det('choppyFlat', 40, 126, 2)
    const c = det('choppyFlat', 40, 252, 2)
    const gapA = a.idxR - a.levR
    const gapB = b.idxR - b.levR
    const gapC = c.idxR - c.levR
    expect(gapB).toBeGreaterThan(gapA)
    expect(gapC).toBeGreaterThan(gapB)
  })
})

describe('trend scenarios', () => {
  it('up but choppy: idxR ≈ +0.10, levR < idxR and levR < 0', () => {
    const r = det('upChoppy', 50, 252, 2)
    expect(Math.abs(r.idxR - 0.1)).toBeLessThan(TOL)
    expect(r.levR).toBeLessThan(r.idxR)
    expect(r.levR).toBeLessThan(0)
  })

  it('barely better: idxR ≈ +0.09, levR ≈ idxR (within ~2pp)', () => {
    const r = det('barelyBetter', 30, 252, 2)
    expect(Math.abs(r.idxR - 0.09)).toBeLessThan(TOL)
    expect(Math.abs(r.levR - r.idxR)).toBeLessThan(0.02)
  })

  it('calm uptrend: levR > idxR and levR > 0 (leverage genuinely wins)', () => {
    const r = det('calmUp', 12, 252, 2)
    expect(r.levR).toBeGreaterThan(r.idxR)
    expect(r.levR).toBeGreaterThan(0)
  })
})

describe('crash — drawdown', () => {
  it('levDD > idxDD; levDD ≈ 0.64; levR < -0.10', () => {
    const r = det('crash', 35, 252, 2)
    expect(r.levDD).toBeGreaterThan(r.idxDD)
    expect(Math.abs(r.levDD - 0.64)).toBeLessThan(TOL)
    expect(r.levR).toBeLessThan(-0.1)
  })
})

describe('textbook', () => {
  it('textbook flat 2x: idxR ≈ +0.113, levR ≈ 0.000', () => {
    const r = det('textbook', 3, 252, 2, true)
    expect(Math.abs(r.idxR - 0.113)).toBeLessThan(TOL)
    expect(Math.abs(r.levR - 0.0)).toBeLessThan(TOL)
  })
})

describe('Monte-Carlo', () => {
  it('MC typical loses: median levR < idxR; pBeat1x in [0.30, 0.50]', () => {
    const mc = monteCarlo(30, 252, 2, 7)
    expect(mc.levR).toBeLessThan(mc.idxR)
    expect(mc.mc.pBeat1x).toBeGreaterThanOrEqual(0.3)
    expect(mc.mc.pBeat1x).toBeLessThanOrEqual(0.5)
  })

  it('memoizes: identical inputs return the same object', () => {
    const a = monteCarlo(30, 252, 2, 7)
    const b = monteCarlo(30, 252, 2, 7)
    expect(a).toBe(b)
  })
})

describe('no-NaN sweep', () => {
  it('every scenario × {L2,L3} × {2d,756d} × extreme swing is finite', () => {
    const levs: Leverage[] = [2, 3]
    for (const scenario of SCENARIO_ORDER) {
      const cfg = CONFIG[scenario]
      for (const L of levs) {
        for (const days of [2, 756]) {
          for (const swing of [cfg.min, cfg.max]) {
            for (const startsUp of [true, false]) {
              const res = simulate({ scenario, swing, days, L, startsUp, seed: 7 })
              expect(Number.isFinite(res.idxR)).toBe(true)
              expect(Number.isFinite(res.levR)).toBe(true)
              expect(Number.isFinite(res.diff)).toBe(true)
              expect(Number.isFinite(res.idxDD)).toBe(true)
              expect(Number.isFinite(res.levDD)).toBe(true)
              for (const p of res.points) {
                expect(Number.isFinite(p.idx)).toBe(true)
                expect(Number.isFinite(p.lev)).toBe(true)
              }
            }
          }
        }
      }
    }
  })
})
