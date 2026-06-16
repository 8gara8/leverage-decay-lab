import { CONFIG } from './lib/scenarios'
import { simulate } from './lib/sim'
import { pct, pctAbs } from './lib/format'

// Phase 0 placeholder: a styled shell that also proves the simulation core is
// wired end-to-end by rendering the headline "choppyFlat" result. The full
// sandbox (Chart, Controls, KPIs, Verdict, Story mode) lands in Phase 2+.
export default function App() {
  const cfg = CONFIG.choppyFlat
  const result = simulate({
    scenario: 'choppyFlat',
    swing: cfg.def,
    days: 252,
    L: 2,
    startsUp: false,
    seed: 7,
  })

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-5 py-12 sm:py-20">
      <header className="flex flex-col gap-3">
        <span className="text-sm font-medium tracking-wide text-[var(--color-ink-dim)]">
          Leverage Decay Lab
        </span>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          槓桿衰減實驗室
        </h1>
        <p className="max-w-prose text-[var(--color-ink-dim)]">
          為什麼 2x／3x 槓桿型 ETF
          通常不適合長期持有？槓桿追蹤的是「每日」報酬，不是整段期間的報酬——
          波動度會一點一點把它磨掉。親手調整市場情境，看它與大盤如何分道揚鑣。
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg">
        <h2 className="mb-1 text-lg font-semibold">震盪盤整 · 預覽</h2>
        <p className="mb-5 text-sm text-[var(--color-ink-dim)]">
          {cfg.swingName} = {cfg.def}
          {cfg.unit}，252 個交易日（約一年），2x 槓桿
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="大盤 (1x) 報酬" value={pct(result.idxR)} tone="neutral" />
          <Stat label="2x ETF 報酬" value={pct(result.levR)} tone="bad" />
          <Stat
            label="和直接買大盤相比"
            value={pct(result.diff)}
            tone={result.diff >= 0 ? 'good' : 'bad'}
            highlight
          />
          <Stat label="2x 途中最大跌幅" value={pctAbs(result.levDD)} tone="warn" />
        </div>
        <p className="mt-5 text-sm text-[var(--color-ink-dim)]">
          大盤上下震盪、最後回到原點，2x
          槓桿卻虧掉一截——這就是波動度衰減（volatility decay）。
        </p>
      </section>

      <footer className="text-xs text-[var(--color-ink-dim)]">
        Phase 0 scaffold · 模擬核心與黃金測試已就緒（
        <code className="text-[var(--color-ink)]">pnpm test</code>
        ）。完整互動沙盒建置中。
      </footer>
    </main>
  )
}

function Stat({
  label,
  value,
  tone,
  highlight,
}: {
  label: string
  value: string
  tone: 'good' | 'bad' | 'warn' | 'neutral'
  highlight?: boolean
}) {
  const toneColor = {
    good: 'var(--color-good)',
    bad: 'var(--color-bad)',
    warn: 'var(--color-warn)',
    neutral: 'var(--color-ink)',
  }[tone]
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? 'border-[var(--color-accent)] bg-[var(--color-surface-2)]'
          : 'border-[var(--color-border)] bg-[var(--color-bg)]'
      }`}
    >
      <div className="text-xs text-[var(--color-ink-dim)]">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums" style={{ color: toneColor }}>
        {value}
      </div>
    </div>
  )
}
