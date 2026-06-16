// Chart.tsx — custom <canvas> renderer (SPEC.md §8.4, §9). Phase 2 is a static
// draw: amber baseline at 100, blue index line, red leveraged line, plus the
// faint Monte-Carlo cloud + median. The `progress` prop (0..1 left-to-right
// reveal) is honoured now so Phase 4 can animate without touching this file.

import { useEffect, useRef, useState } from 'react'
import type { Leverage, PathPoint } from '../lib/sim'

interface ChartProps {
  points: PathPoint[]
  cloud?: number[][]
  L: Leverage
  progress?: number
}

const COLOR_IDX = '#60a5fa' // blue — index 1x
const COLOR_LEV = '#f87171' // red — leveraged Lx
const COLOR_BASE = '#fbbf24' // amber — baseline 100

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

// Draw a value series (indexed by day) with a fractional left-to-right reveal.
function drawSeries(
  ctx: CanvasRenderingContext2D,
  vals: number[],
  xAt: (day: number) => number,
  yAt: (v: number) => number,
  reveal: number,
): void {
  const n = vals.length - 1
  if (n <= 0) return
  const edge = n * reveal
  const full = Math.floor(edge)
  ctx.beginPath()
  ctx.moveTo(xAt(0), yAt(vals[0]))
  const upto = Math.min(full, n)
  for (let i = 1; i <= upto; i++) ctx.lineTo(xAt(i), yAt(vals[i]))
  if (full < n && edge > full) {
    const frac = edge - full
    const x = xAt(full) + (xAt(full + 1) - xAt(full)) * frac
    const y = yAt(vals[full]) + (yAt(vals[full + 1]) - yAt(vals[full])) * frac
    ctx.lineTo(x, y)
  }
  ctx.stroke()
}

function draw(
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
  points: PathPoint[],
  cloud: number[][] | undefined,
  progress: number,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const n = points.length - 1
  if (n <= 0 || w === 0 || h === 0) return

  const padL = 12
  const padR = 14
  const padT = 16
  const padB = 14
  const plotW = w - padL - padR
  const plotH = h - padT - padB

  // y-range across every visible series (incl. the 100 baseline).
  let lo = 100
  let hi = 100
  for (const p of points) {
    if (p.idx < lo) lo = p.idx
    if (p.idx > hi) hi = p.idx
    if (p.lev < lo) lo = p.lev
    if (p.lev > hi) hi = p.lev
  }
  if (cloud) {
    for (const path of cloud) {
      for (const v of path) {
        if (v < lo) lo = v
        if (v > hi) hi = v
      }
    }
  }
  const span = hi - lo
  const pad = span > 0 ? span * 0.08 : 1
  lo = Math.max(0, lo - pad)
  hi = hi + pad
  const range = hi - lo || 1

  const xAt = (day: number) => padL + (day / n) * plotW
  const yAt = (v: number) => padT + (1 - (v - lo) / range) * plotH

  const reveal = clamp01(progress)

  // Baseline at 100 (amber, dashed) + label.
  if (100 >= lo && 100 <= hi) {
    const y = yAt(100)
    ctx.save()
    ctx.strokeStyle = 'rgba(251,191,36,0.45)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(padL, y)
    ctx.lineTo(w - padR, y)
    ctx.stroke()
    ctx.restore()
    ctx.fillStyle = 'rgba(251,191,36,0.85)'
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
    ctx.textBaseline = 'bottom'
    ctx.fillText('100', padL + 2, y - 3)
  }

  // Monte-Carlo cloud (faint red), drawn first so the lines sit on top.
  if (cloud && cloud.length) {
    ctx.strokeStyle = 'rgba(248,113,113,0.10)'
    ctx.lineWidth = 1
    for (const path of cloud) drawSeries(ctx, path, xAt, yAt, reveal)
  }

  // Index line (blue).
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = COLOR_IDX
  ctx.lineWidth = 2
  drawSeries(ctx, points.map((p) => p.idx), xAt, yAt, reveal)

  // Leveraged line (red), slightly heavier — it's the subject.
  ctx.strokeStyle = COLOR_LEV
  ctx.lineWidth = 2.5
  drawSeries(ctx, points.map((p) => p.lev), xAt, yAt, reveal)
}

export default function Chart({ points, cloud, L, progress = 1 }: ChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  // Track the container width; derive a pleasant height from it.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0].contentRect.width
      const ch = Math.round(Math.min(440, Math.max(240, cw * 0.6)))
      setSize((prev) =>
        prev.w === Math.round(cw) && prev.h === ch ? prev : { w: Math.round(cw), h: ch },
      )
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size.w === 0) return
    draw(canvas, size.w, size.h, points, cloud, progress)
  }, [size, points, cloud, progress])

  const isMC = !!cloud && cloud.length > 0

  return (
    <figure className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-lg">
      <div ref={wrapRef} className="w-full">
        <canvas
          ref={canvasRef}
          style={{ width: size.w || '100%', height: size.h || 260 }}
          aria-label="大盤與槓桿 ETF 淨值走勢圖"
        />
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-ink-dim)]">
        <LegendDot color={COLOR_IDX} label="大盤 (1x)" />
        <LegendDot color={COLOR_LEV} label={`${L}x ETF`} />
        <LegendDash color={COLOR_BASE} label="起始 100" />
        {isMC && <LegendDot color="rgba(248,113,113,0.35)" label="隨機路徑" />}
      </figcaption>
    </figure>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function LegendDash({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-0 w-3.5 border-t-2 border-dashed"
        style={{ borderColor: color }}
      />
      {label}
    </span>
  )
}
