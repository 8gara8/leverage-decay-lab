// url.ts — encode/decode the shareable SimState <-> URLSearchParams (SPEC.md §8.7).
//
// Params (compact, social-friendly): ?s=<scenario>&sig=<swing>&d=<days>&L=<2|3>
// plus &up=<0|1> for the textbook direction and &seed=<n> for the random shuffle,
// so a shared link restores the EXACT state. Decoding revalidates every field
// (scenario whitelist, per-scenario swing range, day/leverage clamps) and falls
// back to the supplied defaults, so a hand-edited or stale URL can't break state.

import { CONFIG, SCENARIO_ORDER } from './scenarios'
import type { Leverage, Scenario, SimState } from './sim'

const MIN_DAYS = 2
const MAX_DAYS = 756

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x
}

function parseScenario(v: string | null): Scenario | null {
  return v !== null && (SCENARIO_ORDER as string[]).includes(v) ? (v as Scenario) : null
}

function parseNum(v: string | null): number | null {
  if (v === null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// Build the canonical query string for the current state.
export function encodeState(s: SimState): string {
  const p = new URLSearchParams()
  p.set('s', s.scenario)
  p.set('sig', String(s.swing))
  p.set('d', String(s.days))
  p.set('L', String(s.L))
  if (s.scenario === 'textbook') p.set('up', s.startsUp ? '1' : '0')
  if (s.scenario === 'random') p.set('seed', String(s.seed >>> 0))
  return p.toString()
}

// Parse a query string into a fully-validated SimState, filling gaps from `fallback`.
export function decodeState(search: string, fallback: SimState): SimState {
  const p = new URLSearchParams(search)

  const scenario = parseScenario(p.get('s')) ?? fallback.scenario
  const cfg = CONFIG[scenario]

  // Absent σ means "this scenario's default" when the link switched scenario;
  // otherwise keep the fallback's swing. Either way clamp to the active range.
  const sig = parseNum(p.get('sig'))
  const swingBase = sig ?? (scenario === fallback.scenario ? fallback.swing : cfg.def)
  const swing = clamp(swingBase, cfg.min, cfg.max)

  const days = Math.round(clamp(parseNum(p.get('d')) ?? fallback.days, MIN_DAYS, MAX_DAYS))

  const lRaw = p.get('L')
  const L: Leverage = lRaw === '3' ? 3 : lRaw === '2' ? 2 : fallback.L

  const startsUp = p.has('up') ? p.get('up') === '1' : fallback.startsUp

  const seedParsed = parseNum(p.get('seed'))
  const seed = seedParsed !== null ? seedParsed >>> 0 : fallback.seed

  return { scenario, swing, days, L, startsUp, seed }
}

// Hydrate initial state from the address bar (used by useReducer's lazy init).
export function readInitialState(fallback: SimState): SimState {
  if (typeof window === 'undefined') return fallback
  return decodeState(window.location.search, fallback)
}

// Mirror the live state into the URL without adding history entries (SPEC.md §8.7).
export function writeUrl(state: SimState): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) return
  const url = `${window.location.pathname}?${encodeState(state)}${window.location.hash}`
  window.history.replaceState(null, '', url)
}

// Absolute, copy-pasteable link to the current state for the 複製連結 button.
export function shareUrl(state: SimState): string {
  if (typeof window === 'undefined') return `?${encodeState(state)}`
  return `${window.location.origin}${window.location.pathname}?${encodeState(state)}`
}
