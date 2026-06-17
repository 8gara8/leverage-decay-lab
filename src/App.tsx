// App.tsx — top-level layout. Owns sim state via useSimState and wires the
// design upgrades on top of the functional sandbox (SPEC.md §8, §12).
//
// Mobile (single column) stacks: Hero → Scenario cards + Controls → Verdict →
// Chart → KPIs → Narrative → table. Putting the scenario picker directly under
// the hero makes "choose what you're looking at" the first action on a phone,
// instead of burying it below the chart. On ≥1024px it becomes two columns: a
// narrow left column (scenario cards + controls, sticky as a unit) beside a wide
// right column (verdict, chart, KPIs, narrative, table). The verdict + narrative
// cross-fade on scenario change.

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
import Takeaways from './components/Takeaways'
import { useLocale } from './state/LocaleProvider'
import type { Scenario } from './lib/sim'

export default function App() {
  const { state, config, result, set, reshuffle } = useSimState()
  const { t } = useLocale()
  const isMC = result.mc !== null
  const cloud = result.mc?.cloud

  // The path "race" replays on a meaningfully new chart — scenario, leverage, or
  // a reshuffle — plus the manual ▶︎ 重播 button. Continuous σ/days slider drags
  // are deliberately excluded so dragging doesn't restart the animation midway.
  const [replayNonce, setReplayNonce] = useState(0)
  const raceKey = `${state.scenario}|${state.L}|${state.seed}|${replayNonce}`
  const progress = usePathAnimation(raceKey)
  const replay = useCallback(() => setReplayNonce((n) => n + 1), [])

  const selectScenario = useCallback((s: Scenario) => set({ scenario: s }), [set])

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <Hero />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* Scenario cards + controls — first on mobile so picking a scenario is
            the entry point; sticky left column as one unit on desktop (§8.1). */}
        <div className="lg:col-start-1 lg:row-start-1 lg:row-end-6">
          <div className="flex flex-col gap-6 lg:sticky lg:top-6">
            <ScenarioCards active={state.scenario} onSelect={selectScenario} />
            <Controls state={state} config={config} onChange={set} onReshuffle={reshuffle} />
          </div>
        </div>

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

      <footer lang={t.htmlLang} className="text-xs text-[var(--color-ink-dim)]">
        {t.footer}
      </footer>
    </main>
  )
}
