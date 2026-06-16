// App.tsx — top-level layout. Owns sim state via useSimState and wires the
// Phase 2 functional sandbox (SPEC.md §12 Phase 2, layout §8.1).
//
// Mobile (single column) stacks: Hero → Chart → KPIs → Scenarios → Controls →
// Narrative → table. On ≥1024px it becomes two columns: a narrow left column
// (scenario picker + controls) beside a wide right column (chart, KPIs,
// narrative, table). The big live Verdict banner, scenario sparkline cards and
// story mode land in Phase 3.

import { useSimState } from './state/useSimState'
import Hero from './components/Hero'
import Chart from './components/Chart'
import KpiGrid from './components/KpiGrid'
import ScenarioButtons from './components/ScenarioButtons'
import Controls from './components/Controls'
import Narrative from './components/Narrative'
import DataTable from './components/DataTable'

export default function App() {
  const { state, config, result, set, reshuffle } = useSimState()
  const isMC = result.mc !== null
  const cloud = result.mc?.cloud

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <Hero />

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* Chart — right column, top */}
        <div className="lg:col-start-2 lg:row-start-1">
          <Chart points={result.points} cloud={cloud} L={state.L} />
        </div>

        {/* KPIs — right column */}
        <div className="lg:col-start-2 lg:row-start-2">
          <KpiGrid result={result} L={state.L} isMC={isMC} />
        </div>

        {/* Scenario picker — left column, sticky on desktop */}
        <div className="lg:col-start-1 lg:row-start-1 lg:sticky lg:top-6">
          <ScenarioButtons active={state.scenario} onSelect={(s) => set({ scenario: s })} />
        </div>

        {/* Controls — left column, sticky on desktop */}
        <div className="lg:col-start-1 lg:row-start-2 lg:sticky lg:top-6">
          <Controls state={state} config={config} onChange={set} onReshuffle={reshuffle} />
        </div>

        {/* Narrative — right column */}
        <div className="lg:col-start-2 lg:row-start-3">
          <Narrative state={state} result={result} />
        </div>

        {/* Data table — right column */}
        <div className="lg:col-start-2 lg:row-start-4">
          <DataTable points={result.points} L={state.L} />
        </div>
      </div>

      <footer className="text-xs text-[var(--color-ink-dim)]">
        Phase 2 · 互動沙盒。模擬皆於瀏覽器即時計算，無後端。教學模式、分享連結與動畫建置中。
      </footer>
    </main>
  )
}
