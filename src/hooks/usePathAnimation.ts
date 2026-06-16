// usePathAnimation — drives a 0→1 reveal that powers the chart's left-to-right
// path "race" (SPEC.md §8.4). Restarts whenever `resetKey` changes — a new
// scenario, a leverage flip, a reshuffle, or the ▶︎ 重播 button. Returns LINEAR
// progress; the chart maps it to an eased line reveal plus a trailing
// Monte-Carlo cloud fade-in. Honours prefers-reduced-motion by jumping straight
// to the final frame.

import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function usePathAnimation(resetKey: unknown, duration = 1100): number {
  const [progress, setProgress] = useState(() => (prefersReducedMotion() ? 1 : 0))
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (duration <= 0 || prefersReducedMotion()) {
      setProgress(1)
      return
    }
    setProgress(0)
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setProgress(t)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [resetKey, duration])

  return progress
}
