// ShareLink.tsx — the 「🔗 複製連結」 button (SPEC.md §8.7). Copies an absolute
// link that encodes the current sandbox state, so an eye-opening config is one
// tap to share. Falls back to a prompt() when the async Clipboard API is
// unavailable (insecure context / older browsers), and flashes a confirmation.

import { useEffect, useRef, useState } from 'react'
import { shareUrl } from '../lib/url'
import type { SimState } from '../lib/sim'

export default function ShareLink({ state }: { state: SimState }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  const flash = () => {
    setCopied(true)
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setCopied(false), 1600)
  }

  const copy = async () => {
    const url = shareUrl(state)
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        flash()
        return
      }
    } catch {
      // fall through to the manual prompt
    }
    window.prompt('複製這個連結：', url)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
        copied
          ? 'border-[var(--color-good)] text-[var(--color-good)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-ink)] hover:border-[var(--color-accent)]'
      }`}
    >
      {copied ? '✓ 已複製連結' : '🔗 複製連結'}
    </button>
  )
}
