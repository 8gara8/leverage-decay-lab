// StoryMode.tsx — the 3-step guided walkthrough overlay (SPEC.md §8.6).
// Opens on a fresh visit and walks a newcomer through three "aha" moments,
// auto-selecting the matching scenario each step (so the sandbox behind it is
// already set when they dismiss into it). Esc / arrows / backdrop click work;
// dismissed state lives only in memory. A 「教學模式」 button in the hero reopens it.

import { useEffect, useRef, useState } from 'react'
import { STORY_STEPS, TITLE } from '../lib/copy'
import type { Scenario } from '../lib/sim'
import Sparkline from './Sparkline'

interface StoryModeProps {
  onSelect: (s: Scenario) => void // set the underlying sandbox scenario
  onClose: () => void // dismiss into the full sandbox
}

export default function StoryMode({ onSelect, onClose }: StoryModeProps) {
  const [step, setStep] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const total = STORY_STEPS.length
  const cur = STORY_STEPS[step]
  const isFirst = step === 0
  const isLast = step === total - 1

  // Keep the sandbox in lockstep so dismissing lands on the current step.
  useEffect(() => {
    onSelect(STORY_STEPS[step].scenario)
  }, [step, onSelect])

  // Focus the dialog on open for keyboard + screen-reader users.
  useEffect(() => {
    cardRef.current?.focus()
  }, [])

  // Esc dismisses; arrows step through.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') setStep((s) => Math.min(total - 1, s + 1))
      else if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-title"
        aria-describedby="story-body"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="lab-fade-in w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl outline-none sm:p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
            教學模式 · {step + 1} / {total}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉教學模式"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-ink-dim)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
          >
            ✕
          </button>
        </div>

        {/* Progress dots */}
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {STORY_STEPS.map((s, i) => (
            <span
              key={s.scenario}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
              }`}
            />
          ))}
        </div>

        {/* Shape preview — the "annotated chart" for this step */}
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <Sparkline key={cur.scenario} scenario={cur.scenario} vw={280} vh={110} className="h-24 w-full" />
          <div className="mt-2 flex gap-4 text-[11px] text-[var(--color-ink-dim)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
              大盤 (1x)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-accent-2)' }} />
              2x ETF
            </span>
          </div>
        </div>

        {/* Copy */}
        <h2 id="story-title" className="mt-4 text-lg font-bold text-[var(--color-ink)]">
          {TITLE[cur.scenario]}
        </h2>
        <p id="story-body" className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-dim)]">
          {cur.body}
        </p>

        {/* Navigation */}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={isFirst}
            className="min-h-[44px] rounded-xl border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-ink)] transition-colors enabled:hover:border-[var(--color-accent)] disabled:opacity-40"
          >
            上一步
          </button>
          <button
            type="button"
            onClick={() => (isLast ? onClose() : setStep((s) => Math.min(total - 1, s + 1)))}
            className="min-h-[44px] flex-1 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-bold text-[#0b1120] transition-opacity hover:opacity-90"
          >
            {isLast ? '自己玩玩看 →' : '下一步'}
          </button>
        </div>

        {/* Persistent skip into the sandbox */}
        {!isLast && (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full text-center text-xs text-[var(--color-ink-dim)] underline-offset-2 transition-colors hover:text-[var(--color-ink)] hover:underline"
          >
            跳過教學，直接自己玩 →
          </button>
        )}
      </div>
    </div>
  )
}
