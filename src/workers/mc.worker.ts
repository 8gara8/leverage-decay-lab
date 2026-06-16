// mc.worker.ts — runs the expensive Monte-Carlo simulation off the main thread
// (SPEC.md §12, Phase 4). `useMonteCarlo` posts params here (debounced) and
// applies the result, so dragging the σ slider on the 隨機市場 scenario never
// blocks paint. The synchronous monteCarlo() in lib/sim.ts stays the canonical
// path for SSR/tests.

import { monteCarlo } from '../lib/sim'

export interface MCRequest {
  id: number
  sigma: number
  days: number
  L: number
  seed: number
}

// `self` is typed as the window under the app's DOM lib; cast to the minimal
// worker surface we use so postMessage takes a single argument (the worker
// signature) rather than the window's (message, targetOrigin) form.
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<MCRequest>) => void) | null
  postMessage: (message: unknown) => void
}

ctx.onmessage = (e) => {
  const { id, sigma, days, L, seed } = e.data
  ctx.postMessage({ id, result: monteCarlo(sigma, days, L, seed) })
}
