// Takeaways.tsx — the "key takeaways" footer (SPEC.md §12 Phase 5): the four
// one-line lessons (波動越大越糟 · 時間越長越糟 · 槓桿越高越糟 · 適合短打、不適合長抱).
// A full-width 2×2 grid (single column on mobile). Locale-keyed via i18n.

import { useLocale } from '../state/LocaleProvider'

// Each takeaway reinforces one axis of the decay (σ², time, L²) plus the
// "short-term tool" conclusion. Icons are decorative, paired by position.
const ICONS = ['📈', '⏳', '⚙️', '⚡'] as const

export default function Takeaways() {
  const { t } = useLocale()

  return (
    <section
      aria-labelledby="takeaways-title"
      lang={t.htmlLang}
      className="flex flex-col gap-4"
    >
      <h2
        id="takeaways-title"
        className="text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-dim)]"
      >
        {t.takeaways.title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {t.takeaways.items.map((item, i) => (
          <div
            key={item.label}
            className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              {ICONS[i]}
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-[var(--color-ink)]">{item.label}</span>
              <span className="text-sm leading-relaxed text-[var(--color-ink-dim)]">
                {item.body}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
