// Narrative.tsx — the plain-language result sentence + intuition callout
// (SPEC.md §7), plus the §8.9 honesty disclosure of what the model ignores.

import { intuition, resultSentence, type Narrative as Note } from '../lib/copy'
import type { AnyResult, SimState } from '../lib/sim'

interface NarrativeProps {
  state: SimState
  result: AnyResult
}

const ACCENT: Record<Note['cls'], string> = {
  red: 'var(--color-bad)',
  green: 'var(--color-good)',
}

export default function Narrative({ state, result }: NarrativeProps) {
  const sentence = resultSentence(state, result)
  const why = intuition(state, result)

  return (
    <div className="flex flex-col gap-3">
      <p
        className="rounded-2xl border-l-4 bg-[var(--color-surface)] p-4 text-[15px] leading-relaxed text-[var(--color-ink)]"
        style={{ borderColor: ACCENT[sentence.cls] }}
        dangerouslySetInnerHTML={{ __html: sentence.html }}
      />
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div
          className="mb-1 text-xs font-semibold uppercase tracking-wide"
          style={{ color: ACCENT[why.cls] }}
        >
          為什麼？
        </div>
        <p
          className="text-sm leading-relaxed text-[var(--color-ink-dim)]"
          dangerouslySetInnerHTML={{ __html: why.html }}
        />
      </div>

      <details className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm text-[var(--color-ink-dim)]">
        <summary className="cursor-pointer font-medium text-[var(--color-ink)]">
          這個模型忽略了什麼？
        </summary>
        <p className="mt-2 leading-relaxed">
          為了凸顯波動度衰減，這個模型刻意簡化了。現實裡還有<b>管理費、借券／融資成本、追蹤誤差、稅與滑價</b>，
          這些都讓槓桿 ETF 的長期表現<b>比模型更差</b>，而不是更好。把它當成直覺工具，不是報酬預測。
        </p>
      </details>
    </div>
  )
}
