// Kpi.tsx — a single KPI card (SPEC.md §9). The value count-up animates from
// its previous number to the new target (~400ms) so changes feel responsive
// (§8.5); the tone colour cross-fades when good/bad flips.

import { useCountUp } from '../hooks/useCountUp'
import { pct, pctAbs } from '../lib/format'

export type KpiTone = 'good' | 'bad' | 'warn' | 'neutral'

export interface KpiProps {
  label: string
  value: number
  format: 'pct' | 'pctAbs'
  tone: KpiTone
  sub?: string
  highlight?: boolean
}

const TONE_COLOR: Record<KpiTone, string> = {
  good: 'var(--color-good)',
  bad: 'var(--color-bad)',
  warn: 'var(--color-warn)',
  neutral: 'var(--color-ink)',
}

export default function Kpi({ label, value, format, tone, sub, highlight }: KpiProps) {
  const animated = useCountUp(value)
  const text = format === 'pct' ? pct(animated) : pctAbs(animated)
  return (
    <div
      className={`rounded-xl border p-3 sm:p-4 ${
        highlight
          ? 'border-[var(--color-accent)] bg-[var(--color-surface-2)] ring-1 ring-[var(--color-accent)]/30'
          : 'border-[var(--color-border)] bg-[var(--color-bg)]'
      }`}
    >
      <div className="text-xs text-[var(--color-ink-dim)]">{label}</div>
      <div
        className="mt-1 text-lg font-bold tabular-nums transition-colors duration-300 sm:text-xl"
        style={{ color: TONE_COLOR[tone] }}
      >
        {text}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-[var(--color-ink-dim)]">{sub}</div>}
    </div>
  )
}
