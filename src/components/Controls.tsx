// Controls.tsx — the sandbox controls (SPEC.md §8.1, §9, Phase 2):
// leverage toggle · scenario slider · time horizon (slider + quick buttons) ·
// 🎲 reshuffle (random only) · 先漲後跌/先跌後漲 direction (textbook only).

import type { ReactNode } from 'react'
import type { ScenarioConfig } from '../lib/scenarios'
import type { Leverage, SimState } from '../lib/sim'
import ShareLink from './ShareLink'

interface ControlsProps {
  state: SimState
  config: ScenarioConfig
  onChange: (patch: Partial<SimState>) => void
  onReshuffle: () => void
}

const DAY_PRESETS: { label: string; days: number }[] = [
  { label: '1 月', days: 21 },
  { label: '半年', days: 126 },
  { label: '1 年', days: 252 },
  { label: '3 年', days: 756 },
]

function humanDays(d: number): string {
  if (d >= 252) {
    const y = d / 252
    return `約 ${y.toFixed(d % 252 === 0 ? 0 : 1)} 年`
  }
  const m = d / 21
  return `約 ${m.toFixed(d % 21 === 0 ? 0 : 1)} 個月`
}

export default function Controls({ state, config, onChange, onReshuffle }: ControlsProps) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-lg sm:p-5">
      {/* Leverage */}
      <Field label="槓桿倍數">
        <Segmented
          options={[
            { label: '2x', value: 2 },
            { label: '3x', value: 3 },
          ]}
          value={state.L}
          onSelect={(v) => onChange({ L: v as Leverage })}
        />
      </Field>

      {/* Scenario slider */}
      <Field
        label={config.swingName}
        value={`${state.swing}${config.unit}`}
      >
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={state.swing}
          onChange={(e) => onChange({ swing: Number(e.target.value) })}
          className="lab-slider"
          aria-label={config.swingName}
        />
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-ink-dim)]">
          {config.hint}
        </p>
      </Field>

      {/* Time horizon */}
      <Field label="時間長度" value={`${state.days} 個交易日 · ${humanDays(state.days)}`}>
        <input
          type="range"
          min={2}
          max={756}
          step={1}
          value={state.days}
          onChange={(e) => onChange({ days: Number(e.target.value) })}
          className="lab-slider"
          aria-label="時間長度（交易日）"
        />
        <div className="mt-2 grid grid-cols-4 gap-2">
          {DAY_PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => onChange({ days: p.days })}
              className={`min-h-[36px] rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                state.days === p.days
                  ? 'border-[var(--color-accent)] bg-[var(--color-surface-2)] text-[var(--color-ink)]'
                  : 'border-[var(--color-border)] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Field>

      {/* Textbook direction */}
      {config.showStart && (
        <Field label="走勢方向">
          <Segmented
            options={[
              { label: '先漲後跌', value: 1 },
              { label: '先跌後漲', value: 0 },
            ]}
            value={state.startsUp ? 1 : 0}
            onSelect={(v) => onChange({ startsUp: v === 1 })}
          />
        </Field>
      )}

      {/* Reshuffle (random) */}
      {config.showReshuffle && (
        <button
          type="button"
          onClick={onReshuffle}
          className="min-h-[44px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)]"
        >
          🎲 重新洗牌
        </button>
      )}

      {/* Share the current config (SPEC §8.7) */}
      <ShareLink state={state} />
    </div>
  )
}

function Field({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
        {value && (
          <span className="text-sm font-semibold tabular-nums text-[var(--color-accent)]">
            {value}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function Segmented<T extends number>({
  options,
  value,
  onSelect,
}: {
  options: { label: string; value: T }[]
  value: T
  onSelect: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onSelect(o.value)}
          className={`min-h-[40px] rounded-lg px-4 text-sm font-semibold transition-colors ${
            value === o.value
              ? 'bg-[var(--color-accent)] text-[#0b1120]'
              : 'text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
