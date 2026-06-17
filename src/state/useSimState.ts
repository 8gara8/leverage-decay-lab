// useSimState — the single source of truth for the sandbox (SPEC.md §9).
// useReducer over SimState + a memoized SimResult. Phase 4 adds two things:
//   • URL sync (SPEC §8.7): initial state hydrates from the address bar and every
//     change is mirrored back via history.replaceState, so links are shareable.
//   • Off-thread Monte-Carlo (SPEC §12.3): the expensive 隨機市場 path runs in a
//     Web Worker (debounced) so slider drags never block paint; deterministic
//     scenarios stay synchronous, and a one-time sync compute covers the first
//     MC frame so the chart is never empty.

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { CONFIG, type ScenarioConfig } from '../lib/scenarios'
import { monteCarlo, simulate, type AnyResult, type SimState } from '../lib/sim'
import { encodeState, readInitialState, writeUrl } from '../lib/url'
import { useMonteCarlo } from '../hooks/useMonteCarlo'

const MIN_DAYS = 2
const MAX_DAYS = 756

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x
}

const INITIAL: SimState = {
  scenario: 'choppyFlat',
  swing: CONFIG.choppyFlat.def,
  days: 252,
  L: 2,
  startsUp: true,
  seed: 7,
}

type Action =
  | { type: 'set'; patch: Partial<SimState> }
  | { type: 'reshuffle' }

// Applies a patch with the SPEC.md §4 validation rules: switching scenario
// resets `swing` to the new default, then swing/days/L are clamped to range.
function reducer(state: SimState, action: Action): SimState {
  if (action.type === 'reshuffle') {
    // Deterministic LCG step — varied enough to reshuffle, reproducible for a
    // given starting seed (matters because seed rides in the shareable URL).
    return { ...state, seed: (Math.imul(state.seed, 1664525) + 1013904223) >>> 0 }
  }

  const { patch } = action
  const next: SimState = { ...state, ...patch }

  if (patch.scenario && patch.scenario !== state.scenario) {
    next.swing = CONFIG[next.scenario].def
  }

  const cfg = CONFIG[next.scenario]
  next.swing = clamp(next.swing, cfg.min, cfg.max)
  next.days = Math.round(clamp(next.days, MIN_DAYS, MAX_DAYS))
  next.L = next.L === 3 ? 3 : 2

  return next
}

export interface UseSimState {
  state: SimState
  config: ScenarioConfig
  result: AnyResult
  set: (patch: Partial<SimState>) => void
  reshuffle: () => void
}

export function useSimState(): UseSimState {
  // Hydrate from the URL on first load so shared links restore exact state.
  const [state, dispatch] = useReducer(reducer, INITIAL, readInitialState)

  // Keep the address bar in lockstep with state (replaceState — no history spam).
  // The first run only adopts the landing URL as a baseline without rewriting, so
  // a pristine fresh visit keeps a clean URL and we canonicalise only once the
  // user actually changes something. Comparing the
  // encoded string also makes this idempotent under StrictMode's double effect.
  const lastWritten = useRef<string | null>(null)
  useEffect(() => {
    const qs = encodeState(state)
    if (lastWritten.current === null) {
      lastWritten.current = qs
      return
    }
    if (lastWritten.current === qs) return
    lastWritten.current = qs
    writeUrl(state)
  }, [state])

  const set = useCallback((patch: Partial<SimState>) => dispatch({ type: 'set', patch }), [])
  const reshuffle = useCallback(() => dispatch({ type: 'reshuffle' }), [])

  const config = CONFIG[state.scenario]
  const isRandom = state.scenario === 'random'

  // Deterministic scenarios are O(days) — compute synchronously (null for random).
  const syncResult = useMemo<AnyResult | null>(
    () => (isRandom ? null : simulate(state)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isRandom, state.scenario, state.swing, state.days, state.L, state.startsUp],
  )

  // Monte-Carlo runs off the main thread (debounced) so drags never block paint.
  const mc = useMonteCarlo(
    isRandom ? { sigma: state.swing, days: state.days, L: state.L, seed: state.seed } : null,
  )

  // First-frame fallback for random: a synchronous compute so the chart is never
  // empty before the worker's first result. Memoized by the random params AND
  // gated on `mc` being absent, so (a) the re-render every animation frame reuses
  // it instead of recomputing 600 paths, and (b) a drag after the first result
  // returns null here (mc is populated) — the worker owns those, never the main
  // thread. Deterministic scenarios don't need it.
  const mcFallback = useMemo<AnyResult | null>(
    () => (isRandom && !mc ? monteCarlo(state.swing, state.days, state.L, state.seed) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isRandom, mc, state.swing, state.days, state.L, state.seed],
  )

  // Exactly one source is populated: deterministic → syncResult; random → mc, or
  // mcFallback until the worker's first result lands. So the result is always set.
  const result: AnyResult = (syncResult ?? mc ?? mcFallback)!

  return { state, config, result, set, reshuffle }
}
