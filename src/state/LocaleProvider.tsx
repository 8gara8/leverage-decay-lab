// LocaleProvider — React context for the Phase 5 language toggle (SPEC.md §12).
// Holds the active locale in memory (default zh-Hant) and exposes the resolved
// string table `t`. The root <html lang> intentionally stays zh-Hant (the page's
// predominant language while the analytical sections remain Chinese); only the
// translated chrome regions mark themselves with `lang={t.htmlLang}` locally, so
// assistive tech treats Chinese text as Chinese. See src/lib/i18n.ts for the
// scope of what's translated and why locale isn't yet in the URL.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_LOCALE,
  STRINGS,
  readInitialLocale,
  type Locale,
  type UIStrings,
} from '../lib/i18n'

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: UIStrings
}

// Safe default so components (and tests) work even without an enclosing
// provider: zh-Hant strings and a no-op setter.
const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: STRINGS[DEFAULT_LOCALE],
})

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(readInitialLocale)

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: STRINGS[locale] }),
    [locale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext)
}
