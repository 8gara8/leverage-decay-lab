// ScenarioButtons.tsx — plain tappable scenario selector (SPEC.md §12 Phase 2).
// Phase 3 replaces this with ScenarioCards.tsx (sparkline previews, §8.3).

import { SCENARIO_ORDER } from '../lib/scenarios'
import { SUBTITLE, TITLE } from '../lib/copy'
import type { Scenario } from '../lib/sim'

interface ScenarioButtonsProps {
  active: Scenario
  onSelect: (s: Scenario) => void
}

export default function ScenarioButtons({ active, onSelect }: ScenarioButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
      {SCENARIO_ORDER.map((s) => {
        const isActive = s === active
        return (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(s)}
            aria-pressed={isActive}
            className={`min-h-[44px] rounded-xl border px-3 py-2.5 text-left transition-colors ${
              isActive
                ? 'border-[var(--color-accent)] bg-[var(--color-surface-2)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/60'
            }`}
          >
            <div className="text-sm font-semibold text-[var(--color-ink)]">{TITLE[s]}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-[var(--color-ink-dim)]">
              {SUBTITLE[s]}
            </div>
          </button>
        )
      })}
    </div>
  )
}
