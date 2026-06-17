// Hero.tsx — title, hook line, and the core-intuition equation box (SPEC.md §9),
// plus the Phase 5 language toggle (§12). Static copy is locale-keyed via i18n.

import { useLocale } from '../state/LocaleProvider'
import LangToggle from './LangToggle'

export default function Hero() {
  const { t } = useLocale()
  const h = t.hero

  return (
    <header className="flex flex-col gap-3" lang={t.htmlLang}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="min-w-0 text-sm font-medium tracking-wide text-[var(--color-ink-dim)]">
          {h.eyebrow}
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <LangToggle />
        </div>
      </div>
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{h.title}</h1>
      <p className="max-w-prose text-[var(--color-ink-dim)]">{h.hook}</p>
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm">
        <span className="text-[var(--color-ink-dim)]">{h.intuitionPre}</span>
        <b className="text-[var(--color-accent)]">{h.intuitionDaily}</b>
        <span className="text-[var(--color-ink-dim)]">{h.intuitionMid}</span>
        <b className="text-[var(--color-ink)]">{h.intuitionPeriod}</b>
        <span className="text-[var(--color-ink-dim)]">{h.intuitionPost}</span>
      </div>
    </header>
  )
}
