// LocaleProvider — React context for the Phase 5 language toggle (SPEC.md §12).
// Holds the active locale in memory (default zh-Hant), exposes the resolved
// string table `t`, and keeps <html lang> in sync. See src/lib/i18n.ts for the
// scope of what's translated and why locale isn't yet in the URL.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
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

  // Reflect the language on the document for a11y / correct line-breaking.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = STRINGS[locale].htmlLang
    }
  }, [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: STRINGS[locale] }),
    [locale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext)
}
