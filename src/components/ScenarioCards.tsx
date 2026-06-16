// ScenarioCards.tsx — tappable scenario picker with inline sparkline previews
// (SPEC.md §8.3). Each card shows its zh-Hant title, a one-line subtitle, and a
// tiny index-vs-leveraged sparkline so the user sees "red ends below blue"
// before clicking. Replaces the plain Phase 2 buttons. Active card highlighted.

import { SCENARIO_ORDER } from '../lib/scenarios'
import { SUBTITLE, TITLE } from '../lib/copy'
import type { Scenario } from '../lib/sim'
import Sparkline from './Sparkline'

interface ScenarioCardsProps {
  active: Scenario
  onSelect: (s: Scenario) => void
}

export default function ScenarioCards({ active, onSelect }: ScenarioCardsProps) {
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
            className={`flex min-h-[44px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
              isActive
                ? 'border-[var(--color-accent)] bg-[var(--color-surface-2)] ring-1 ring-[var(--color-accent)]/30'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/60'
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--color-ink)]">{TITLE[s]}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-[var(--color-ink-dim)]">
                {SUBTITLE[s]}
              </span>
            </span>
            <Sparkline
              scenario={s}
              className={`h-7 w-16 shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-80'}`}
            />
          </button>
        )
      })}
    </div>
  )
}
