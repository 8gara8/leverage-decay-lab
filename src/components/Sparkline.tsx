// Sparkline.tsx — a tiny inline-SVG preview of a scenario's shape (SPEC.md §8.3).
// Draws the index (blue) vs leveraged (red) net-value lines at the scenario's
// default settings on a shared y-scale, so the divergence reads at a glance.
// Used by ScenarioCards (small) and StoryMode (large). It's decorative — the
// card title/subtitle carry the meaning — so the SVG is aria-hidden.

import { useMemo } from 'react'
import { simulate, type Scenario } from '../lib/sim'
import { CONFIG } from '../lib/scenarios'

// Short horizon keeps the Monte-Carlo preview cheap while still showing shape.
const SPARK_DAYS = 180

interface SparkData {
  idx: number[]
  lev: number[]
}

// Precompute once per scenario (defaults are static); cache across cards/steps.
const cache = new Map<Scenario, SparkData>()

function sparkData(scenario: Scenario): SparkData {
  const hit = cache.get(scenario)
  if (hit) return hit
  const cfg = CONFIG[scenario]
  const res = simulate({
    scenario,
    swing: cfg.def,
    days: SPARK_DAYS,
    L: 2,
    startsUp: true,
    seed: 7,
  })
  const data: SparkData = {
    idx: res.points.map((p) => p.idx),
    lev: res.points.map((p) => p.lev),
  }
  cache.set(scenario, data)
  return data
}

interface SparklineProps {
  scenario: Scenario
  vw?: number // viewBox width  (drawing coordinates)
  vh?: number // viewBox height (drawing coordinates)
  className?: string // controls the rendered box size
}

export default function Sparkline({ scenario, vw = 64, vh = 28, className }: SparklineProps) {
  const { idx, lev } = useMemo(() => sparkData(scenario), [scenario])

  // Shared scale across both series, anchored to the 100 baseline (§8.9).
  let lo = 100
  let hi = 100
  for (const v of idx) {
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  for (const v of lev) {
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  const span = hi - lo || 1
  const pad = 2
  const n = idx.length - 1 || 1
  const xAt = (i: number) => pad + (i / n) * (vw - 2 * pad)
  const yAt = (v: number) => pad + (1 - (v - lo) / span) * (vh - 2 * pad)
  const toPath = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(' ')

  const baseY = 100 >= lo && 100 <= hi ? yAt(100) : null

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {baseY !== null && (
        <line
          x1={pad}
          y1={baseY}
          x2={vw - pad}
          y2={baseY}
          stroke="var(--color-baseline)"
          strokeOpacity="0.4"
          strokeWidth="1"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <path
        d={toPath(idx)}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={toPath(lev)}
        fill="none"
        stroke="var(--color-accent-2)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
