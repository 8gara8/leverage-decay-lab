// KpiGrid.tsx — the four headline KPIs (SPEC.md §8.5, §9):
// 大盤(1x)報酬 · Lx ETF報酬 · 和直接買大盤相比 (highlighted) · Lx 途中最大跌幅.

import type { AnyResult, Leverage } from '../lib/sim'
import { pctAbs } from '../lib/format'
import Kpi from './Kpi'

interface KpiGridProps {
  result: AnyResult
  L: Leverage
  isMC: boolean
}

export default function KpiGrid({ result, L, isMC }: KpiGridProps) {
  const med = isMC ? '（中位數）' : ''
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <Kpi
        label={`大盤 (1x)${med}報酬`}
        value={result.idxR}
        format="pct"
        tone="neutral"
      />
      <Kpi
        label={`${L}x ETF${med}報酬`}
        value={result.levR}
        format="pct"
        tone={result.levR >= 0 ? 'good' : 'bad'}
      />
      <Kpi
        label="和直接買大盤相比"
        value={result.diff}
        format="pct"
        tone={result.diff >= 0 ? 'good' : 'bad'}
        highlight
      />
      <Kpi
        label={`${L}x 途中最大跌幅`}
        value={result.levDD}
        format="pctAbs"
        tone="warn"
        sub={`大盤 ${pctAbs(result.idxDD)}`}
      />
    </div>
  )
}
