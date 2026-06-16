// useSimState — the single source of truth for the sandbox (SPEC.md §9).
// useReducer over SimState + a memoized SimResult. URL sync lands in Phase 4;
// for now state lives only in memory.

import { useCallback, useMemo, useReducer, useState } from 'react'
import { CONFIG, type ScenarioConfig } from '../lib/scenarios'
import { simulate, type AnyResult, type SimState } from '../lib/sim'

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
    // given starting seed (matters once Phase 4 puts seed in the URL).
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
  replayKey: number
}

export function useSimState(): UseSimState {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  // Bumped on every change so Phase 4's animation can re-trigger off it.
  const [replayKey, setReplayKey] = useState(0)

  const set = useCallback((patch: Partial<SimState>) => {
    dispatch({ type: 'set', patch })
    setReplayKey((k) => k + 1)
  }, [])

  const reshuffle = useCallback(() => {
    dispatch({ type: 'reshuffle' })
    setReplayKey((k) => k + 1)
  }, [])

  const config = CONFIG[state.scenario]
  const result = useMemo(
    () => simulate(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.scenario, state.swing, state.days, state.L, state.startsUp, state.seed],
  )

  return { state, config, result, set, reshuffle, replayKey }
}
