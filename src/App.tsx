// App.tsx — top-level layout. Owns sim state via useSimState and wires the
// Phase 3 design upgrades on top of the Phase 2 sandbox (SPEC.md §8, §12).
//
// Mobile (single column) stacks: Hero → Verdict → Chart → KPIs → Scenario cards
// → Controls → Narrative → table (§8.1). On ≥1024px it becomes two columns: a
// narrow left column (scenario cards + controls, sticky as a unit) beside a wide
// right column (verdict, chart, KPIs, narrative, table). Story mode overlays on
// a fresh visit; the verdict + narrative cross-fade on scenario change.

import { useCallback, useState } from 'react'
import { useSimState } from './state/useSimState'
import { usePathAnimation } from './hooks/usePathAnimation'
import Hero from './components/Hero'
import Verdict from './components/Verdict'
import Chart from './components/Chart'
import KpiGrid from './components/KpiGrid'
import ScenarioCards from './components/ScenarioCards'
import Controls from './components/Controls'
import Narrative from './components/Narrative'
import DataTable from './components/DataTable'
import StoryMode from './components/StoryMode'
import Takeaways from './components/Takeaways'
import { useLocale } from './state/LocaleProvider'
import { CONFIG } from './lib/scenarios'
import type { Scenario } from './lib/sim'

// Story mode greets first-time visitors. A shared link (Phase 4 URL state)
// should drop straight into the sandbox, so we suppress it when share params
// are present — wiring that's ready before url.ts lands.
function hasShareParams(): boolean {
  if (typeof window === 'undefined') return false
  const p = new URLSearchParams(window.location.search)
  return p.has('s') || p.has('sig') || p.has('d') || p.has('L')
}

export default function App() {
  const { state, config, result, set, reshuffle } = useSimState()
  const { t } = useLocale()
  const isMC = result.mc !== null
  const cloud = result.mc?.cloud
  const [storyOpen, setStoryOpen] = useState(() => !hasShareParams())

  // The path "race" replays on a meaningfully new chart — scenario, leverage, or
  // a reshuffle — plus the manual ▶︎ 重播 button. Continuous σ/days slider drags
  // are deliberately excluded so dragging doesn't restart the animation midway.
  const [replayNonce, setReplayNonce] = useState(0)
  const raceKey = `${state.scenario}|${state.L}|${state.seed}|${replayNonce}`
  const progress = usePathAnimation(raceKey)
  const replay = useCallback(() => setReplayNonce((n) => n + 1), [])

  // Stable so StoryMode's step effect only fires on an actual step change.
  const selectScenario = useCallback((s: Scenario) => set({ scenario: s }), [set])

  // The guided walkthrough is a fixed 2x · 1-year · default-σ lesson (its copy
  // and sparklines assume that framing). So each step applies the FULL baseline,
  // not just the scenario — otherwise reopening the tutorial after dialing 3x or
  // a short horizon would dismiss onto a chart that contradicts the lesson.
  const applyStoryStep = useCallback(
    (s: Scenario) => set({ scenario: s, L: 2, days: 252, swing: CONFIG[s].def }),
    [set],
  )

  return (
    <>
      <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <Hero onOpenStory={() => setStoryOpen(true)} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start lg:gap-8">
          {/* Verdict — full-width takeaway, right column on desktop (§8.2) */}
          <div key={`v-${state.scenario}`} className="lab-fade-in lg:col-start-2 lg:row-start-1">
            <Verdict diff={result.diff} L={state.L} />
          </div>

          {/* Chart */}
          <div className="lg:col-start-2 lg:row-start-2">
            <Chart
              points={result.points}
              cloud={cloud}
              L={state.L}
              progress={progress}
              onReplay={replay}
            />
          </div>

          {/* KPIs */}
          <div className="lg:col-start-2 lg:row-start-3">
            <KpiGrid result={result} L={state.L} isMC={isMC} />
          </div>

          {/* Left column: scenario cards + controls, sticky as one unit on desktop */}
          <div className="lg:col-start-1 lg:row-start-1 lg:row-end-6">
            <div className="flex flex-col gap-6 lg:sticky lg:top-6">
              <ScenarioCards active={state.scenario} onSelect={selectScenario} />
              <Controls state={state} config={config} onChange={set} onReshuffle={reshuffle} />
            </div>
          </div>

          {/* Narrative */}
          <div key={`n-${state.scenario}`} className="lab-fade-in lg:col-start-2 lg:row-start-4">
            <Narrative state={state} result={result} />
          </div>

          {/* Data table */}
          <div className="lg:col-start-2 lg:row-start-5">
            <DataTable points={result.points} L={state.L} />
          </div>
        </div>

        {/* Key takeaways — full-width footer (§12 Phase 5) */}
        <Takeaways />

        <footer className="text-xs text-[var(--color-ink-dim)]">{t.footer}</footer>
      </main>

      {storyOpen && <StoryMode onSelect={applyStoryStep} onClose={() => setStoryOpen(false)} />}
    </>
  )
}
