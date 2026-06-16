// Golden tests for the shareable URL codec (SPEC.md §8.7). Locks the round-trip
// and the revalidation/clamping so a refactor (or a hand-edited link) can't
// silently corrupt restored state. encodeState/decodeState are pure (URLSearchParams
// only), so they run under Vitest's node environment with no DOM.

import { describe, expect, it } from 'vitest'
import { decodeState, encodeState } from './url'
import { CONFIG } from './scenarios'
import type { SimState } from './sim'

const BASE: SimState = {
  scenario: 'choppyFlat',
  swing: 40,
  days: 252,
  L: 2,
  startsUp: true,
  seed: 7,
}

describe('encodeState / decodeState', () => {
  it('round-trips representative states', () => {
    const states: SimState[] = [
      { scenario: 'choppyFlat', swing: 40, days: 252, L: 2, startsUp: true, seed: 7 },
      { scenario: 'upChoppy', swing: 60, days: 126, L: 3, startsUp: true, seed: 7 },
      { scenario: 'crash', swing: 50, days: 756, L: 2, startsUp: false, seed: 99 },
      { scenario: 'textbook', swing: 2.5, days: 60, L: 2, startsUp: false, seed: 7 },
      { scenario: 'random', swing: 30, days: 504, L: 3, startsUp: true, seed: 123456 },
    ]
    for (const s of states) {
      expect(decodeState(encodeState(s), s)).toEqual(s)
    }
  })

  it('encodes the textbook direction and restores it from the URL (not the fallback)', () => {
    const qs = encodeState({ ...BASE, scenario: 'textbook', swing: 3, startsUp: false })
    const out = decodeState(qs, { ...BASE, scenario: 'textbook', startsUp: true })
    expect(out.startsUp).toBe(false)
  })

  it('encodes the random seed and restores it from the URL (not the fallback)', () => {
    const qs = encodeState({ ...BASE, scenario: 'random', swing: 30, seed: 42 })
    const out = decodeState(qs, { ...BASE, scenario: 'random', seed: 1 })
    expect(out.seed).toBe(42)
  })

  it('clamps an out-of-range σ to the active scenario range', () => {
    const cfg = CONFIG.choppyFlat
    expect(decodeState('?s=choppyFlat&sig=999&d=252&L=2', BASE).swing).toBe(cfg.max)
    expect(decodeState('?s=choppyFlat&sig=0&d=252&L=2', BASE).swing).toBe(cfg.min)
  })

  it('falls back on an unknown scenario and invalid leverage', () => {
    const out = decodeState('?s=bogus&L=5', BASE)
    expect(out.scenario).toBe(BASE.scenario)
    expect(out.L).toBe(BASE.L)
  })

  it('uses the scenario default σ when the link switches scenario without sig', () => {
    const out = decodeState('?s=calmUp', BASE)
    expect(out.scenario).toBe('calmUp')
    expect(out.swing).toBe(CONFIG.calmUp.def)
  })

  it('clamps days into [2, 756]', () => {
    expect(decodeState('?s=choppyFlat&d=99999', BASE).days).toBe(756)
    expect(decodeState('?s=choppyFlat&d=1', BASE).days).toBe(2)
  })

  it('returns the fallback unchanged for an empty query', () => {
    expect(decodeState('', BASE)).toEqual(BASE)
  })

  it('treats blank numeric params as absent (not Number("") === 0)', () => {
    // ?s=random&sig=&d=&L=2 must NOT decode to min-σ / a 2-day horizon.
    const out = decodeState('?s=random&sig=&d=&L=2', BASE)
    expect(out.scenario).toBe('random')
    expect(out.swing).toBe(CONFIG.random.def) // scenario switched, blank σ → default
    expect(out.days).toBe(BASE.days) // blank d → fallback, not clamped to 2
    expect(out.L).toBe(2)
  })
})
