// useCountUp — animates a number from its previous value to a new target over
// ~400ms with an ease-out curve (SPEC.md §8.5). Returns the live value so KPI
// cards feel responsive when inputs change. Honours `prefers-reduced-motion`
// (jumps straight to the target) and resumes from the on-screen value if the
// target changes mid-flight, so rapid slider drags never jump backwards.

import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// ease-out cubic: fast start, gentle settle.
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function useCountUp(target: number, duration = 400): number {
  const [value, setValue] = useState(target)
  const valueRef = useRef(target) // latest rendered value (the animation's "from")
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (duration <= 0 || prefersReducedMotion()) {
      valueRef.current = target
      setValue(target)
      return
    }

    const from = valueRef.current
    if (from === target) return

    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const current = from + (target - from) * easeOut(t)
      valueRef.current = current
      setValue(current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        valueRef.current = target
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
  }, [target, duration])

  return value
}
