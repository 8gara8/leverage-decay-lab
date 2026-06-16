// DataTable.tsx — the first-days net-value table (SPEC.md §8.1). Collapsible so
// it stays out of the way on mobile.

import type { Leverage, PathPoint } from '../lib/sim'
import { num, pct } from '../lib/format'

interface DataTableProps {
  points: PathPoint[]
  L: Leverage
}

const ROWS = 11 // day 0..10

export default function DataTable({ points, L }: DataTableProps) {
  const rows = points.slice(0, ROWS)
  return (
    <details className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <summary className="cursor-pointer text-sm font-medium text-[var(--color-ink)]">
        看前 {rows.length - 1} 天的逐日數字
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-right text-xs tabular-nums">
          <thead>
            <tr className="text-[var(--color-ink-dim)]">
              <th className="px-2 py-1.5 text-left font-medium">日</th>
              <th className="px-2 py-1.5 font-medium">大盤日報酬</th>
              <th className="px-2 py-1.5 font-medium">大盤淨值</th>
              <th className="px-2 py-1.5 font-medium" style={{ color: 'var(--color-accent-2)' }}>
                {L}x 日報酬
              </th>
              <th className="px-2 py-1.5 font-medium" style={{ color: 'var(--color-accent-2)' }}>
                {L}x 淨值
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.day} className="border-t border-[var(--color-border)]">
                <td className="px-2 py-1.5 text-left text-[var(--color-ink-dim)]">{p.day}</td>
                <td className="px-2 py-1.5">{p.day === 0 ? '—' : pct(p.idxMove, 2)}</td>
                <td className="px-2 py-1.5">{num(p.idx, 2)}</td>
                <td className="px-2 py-1.5">{p.day === 0 ? '—' : pct(p.levMove, 2)}</td>
                <td className="px-2 py-1.5">{num(p.lev, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
