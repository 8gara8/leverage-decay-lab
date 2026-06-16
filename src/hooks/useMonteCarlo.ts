// useMonteCarlo — runs monteCarlo() in a Web Worker, debounced (~80ms), so rapid
// σ-slider drags on the 隨機市場 scenario never block paint (SPEC.md §12, Phase 4).
// Returns the latest off-thread result (null until the first one resolves). When
// Workers are unavailable (SSR/tests) it computes synchronously. The caller
// (useSimState) renders a one-time synchronous result for the very first frame,
// so the chart is never empty while the worker spins up.

import { useEffect, useRef, useState } from 'react'
import { monteCarlo, type MCResult } from '../lib/sim'
import type { MCRequest } from '../workers/mc.worker'

export interface MCParams {
  sigma: number
  days: number
  L: number
  seed: number
}

const DEBOUNCE_MS = 80

export function useMonteCarlo(params: MCParams | null): MCResult | null {
  const [result, setResult] = useState<MCResult | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const latestId = useRef(0)

  // Create the worker once (browser only).
  useEffect(() => {
    if (typeof Worker === 'undefined') return
    const worker = new Worker(new URL('../workers/mc.worker.ts', import.meta.url), {
      type: 'module',
    })
    worker.onmessage = (e: MessageEvent<{ id: number; result: MCResult }>) => {
      // Apply only the most recently posted request's result (ignore stragglers
      // from params the user has already dragged past).
      if (e.data.id === latestId.current) setResult(e.data.result)
    }
    workerRef.current = worker
    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  // The full param identity — re-running on any change is the intent.
  const key = params ? `${params.sigma}|${params.days}|${params.L}|${params.seed}` : null

  useEffect(() => {
    if (!params) return
    const worker = workerRef.current

    // No worker (SSR/tests/unsupported): compute synchronously on this thread.
    if (!worker) {
      setResult(monteCarlo(params.sigma, params.days, params.L, params.seed))
      return
    }

    // Debounce, then offload. Each post is stamped with an incrementing id so a
    // late response from superseded params is discarded by onmessage above.
    const timer = window.setTimeout(() => {
      const msg: MCRequest = { id: ++latestId.current, ...params }
      worker.postMessage(msg)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
    // params is captured through `key`; depending on `key` alone is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return result
}
