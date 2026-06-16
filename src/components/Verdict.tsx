// Verdict.tsx — the big live one-line takeaway banner (SPEC.md §8.2, §7).
// Sits directly under the hero and restates the bottom line in plain language,
// colour-coded to reality (green when leverage wins, red when it loses). This is
// the single most important "understand it in 2 seconds" element.

import type { Leverage } from '../lib/sim'
import { pctAbs } from '../lib/format'

interface VerdictProps {
  diff: number // levR - idxR
  L: Leverage
}

export default function Verdict({ diff, L }: VerdictProps) {
  const win = diff >= 0
  const amount = pctAbs(diff)

  const tone = win
    ? { color: 'var(--color-good)', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.45)', icon: '✓' }
    : { color: 'var(--color-bad)', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.45)', icon: '✕' }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-2xl border p-4 transition-colors sm:p-5"
      style={{ backgroundColor: tone.bg, borderColor: tone.border }}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{ backgroundColor: tone.color, color: 'var(--color-bg)' }}
      >
        {tone.icon}
      </span>
      <p className="text-[15px] font-medium leading-relaxed text-[var(--color-ink)] sm:text-base">
        {win ? (
          <>
            這個情境下，
            <b style={{ color: tone.color }}>
              {L}x 槓桿多賺了 {amount}
            </b>
            ，但你扛的是 {L} 倍的波動與更深的回檔。
          </>
        ) : (
          <>
            在這個情境下，買{' '}
            <b style={{ color: tone.color }}>
              {L}x ETF 反而少賺 {amount}
            </b>
            {' '}—— 不如直接買大盤。
          </>
        )}
      </p>
    </div>
  )
}
