// LangToggle — segmented 中 / EN switch (SPEC.md §12 Phase 5). Sits in the hero
// top bar. zh-Hant is the default; toggling re-renders the chrome that has
// locale-keyed strings (see src/lib/i18n.ts for current coverage).

import { LOCALES } from '../lib/i18n'
import { useLocale } from '../state/LocaleProvider'

export default function LangToggle() {
  const { locale, setLocale, t } = useLocale()

  return (
    <div
      role="group"
      aria-label={t.lang.group}
      className="inline-flex shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
    >
      {LOCALES.map((l) => {
        const active = l === locale
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={active}
            className={`min-w-[2.25rem] rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
                : 'text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]'
            }`}
          >
            {l === 'en' ? t.lang.en : t.lang.zh}
          </button>
        )
      })}
    </div>
  )
}
