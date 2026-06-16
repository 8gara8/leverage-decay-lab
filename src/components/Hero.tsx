// Hero.tsx — title, hook line, and the core-intuition equation box (SPEC.md §9),
// plus a persistent 「教學模式」 button that reopens the guided walkthrough (§8.6).

interface HeroProps {
  onOpenStory?: () => void
}

export default function Hero({ onOpenStory }: HeroProps) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium tracking-wide text-[var(--color-ink-dim)]">
          Leverage Decay Lab
        </span>
        {onOpenStory && (
          <button
            type="button"
            onClick={onOpenStory}
            className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-dim)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
          >
            📖 教學模式
          </button>
        )}
      </div>
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">槓桿衰減實驗室</h1>
      <p className="max-w-prose text-[var(--color-ink-dim)]">
        為什麼 2x／3x 槓桿型 ETF
        通常不適合長期持有？親手調整市場情境，看它與大盤如何分道揚鑣。
      </p>
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm">
        <span className="text-[var(--color-ink-dim)]">關鍵直覺：槓桿 ETF 追蹤的是 </span>
        <b className="text-[var(--color-accent)]">每日報酬 × L</b>
        <span className="text-[var(--color-ink-dim)]">，不是 </span>
        <b className="text-[var(--color-ink)]">整段報酬 × L</b>
        <span className="text-[var(--color-ink-dim)]"> —— 中間的波動會被一點一點磨掉。</span>
      </div>
    </header>
  )
}
