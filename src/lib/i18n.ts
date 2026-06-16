// i18n scaffold (SPEC.md §12 Phase 5 — "optional EN/中文 language toggle").
//
// This lays down the locale infrastructure and translates the static *chrome*
// layer (hero, key-takeaways footer, page footer, the toggle itself). zh-Hant is
// the product language and the default (SPEC.md §13).
//
// Deliberately OUT OF SCOPE for this scaffold — the analytical copy that is
// tightly coupled to live numbers and zh-Hant phrasing:
//   • src/lib/copy.ts   (scenario titles/subtitles, resultSentence, intuition, story steps)
//   • Verdict / Controls / KpiGrid / ScenarioCards / Narrative / DataTable / StoryMode labels
// Those stay zh-Hant for now. To finish localisation, give each a locale-keyed
// entry the same way `STRINGS` does here, then read it via `useLocale().t`.
//
// NOTE: locale lives in memory only. It is NOT yet persisted to the URL because
// Phase 4's `writeUrl` (src/lib/url.ts) rebuilds the query string from SimState
// on every change and would drop a `?lang=` param. Persisting locale means
// threading it through encodeState/decodeState — a follow-up.

export type Locale = 'zh-Hant' | 'en'

export const LOCALES: readonly Locale[] = ['zh-Hant', 'en'] as const
export const DEFAULT_LOCALE: Locale = 'zh-Hant'

export interface Takeaway {
  label: string
  body: string
}

// The static UI strings that the toggle currently controls.
export interface UIStrings {
  // BCP-47 lang tag for this locale, applied as `lang=` on the translated chrome
  // regions (hero/takeaways/footer). The root <html> stays zh-Hant — see
  // LocaleProvider for why.
  htmlLang: string
  hero: {
    eyebrow: string // small label above the title (the "other" language's name)
    storyButton: string
    title: string
    hook: string
    intuitionPre: string
    intuitionDaily: string // accent-blue emphasis: "daily return × L"
    intuitionMid: string
    intuitionPeriod: string // ink emphasis: "period return × L"
    intuitionPost: string
  }
  takeaways: {
    title: string
    items: [Takeaway, Takeaway, Takeaway, Takeaway]
  }
  footer: string
  lang: {
    /** aria-label for the toggle group */
    group: string
    zh: string
    en: string
  }
}

export const STRINGS: Record<Locale, UIStrings> = {
  'zh-Hant': {
    htmlLang: 'zh-Hant',
    hero: {
      eyebrow: 'Leverage Decay Lab',
      storyButton: '📖 教學模式',
      title: '槓桿衰減實驗室',
      hook: '為什麼 2x／3x 槓桿型 ETF 通常不適合長期持有？親手調整市場情境，看它與大盤如何分道揚鑣。',
      intuitionPre: '關鍵直覺：槓桿 ETF 追蹤的是 ',
      intuitionDaily: '每日報酬 × L',
      intuitionMid: '，不是 ',
      intuitionPeriod: '整段報酬 × L',
      intuitionPost: ' —— 中間的波動會被一點一點磨掉。',
    },
    takeaways: {
      title: '帶走這四件事',
      items: [
        {
          label: '波動越大越糟',
          body: '波動度衰減大致隨 σ² 成長：波動翻倍，損耗約變四倍。',
        },
        {
          label: '時間越長越糟',
          body: '槓桿每天重設，磨損會逐日累積；抱得越久，和大盤的缺口越大。',
        },
        {
          label: '槓桿越高越糟',
          body: '損耗大致隨 L² 放大：3x 衰減得比 2x 嚴重得多。',
        },
        {
          label: '適合短打、不適合長抱',
          body: '槓桿 ETF 是日內／短線的工具，不是拿來長期持有的資產。',
        },
      ],
    },
    footer: '所有模擬皆於瀏覽器即時計算，無後端、無追蹤。這是教學工具，不是投資建議。',
    lang: { group: '語言 / Language', zh: '中', en: 'EN' },
  },
  en: {
    htmlLang: 'en',
    hero: {
      eyebrow: '槓桿衰減實驗室',
      storyButton: '📖 Guided tour',
      title: 'Leverage Decay Lab',
      hook: 'Why are 2x / 3x leveraged ETFs usually a poor long-term hold? Tweak the market scenario yourself and watch the fund part ways with the index.',
      intuitionPre: 'The key intuition: a leveraged ETF tracks ',
      intuitionDaily: 'the daily return × L',
      intuitionMid: ', not ',
      intuitionPeriod: 'the period return × L',
      intuitionPost: ' — the volatility in between gets ground away, bit by bit.',
    },
    takeaways: {
      title: 'Four things to take away',
      items: [
        {
          label: 'More volatility, worse',
          body: 'Volatility decay grows with σ²: double the volatility and the drag roughly quadruples.',
        },
        {
          label: 'More time, worse',
          body: 'Leverage resets daily, so the drag compounds — the longer you hold, the wider the gap to the index.',
        },
        {
          label: 'More leverage, worse',
          body: 'Decay scales roughly with L²: a 3x fund decays far faster than a 2x one.',
        },
        {
          label: 'A short-term tool, not a long-term hold',
          body: 'Leveraged ETFs are intraday / short-term instruments — not assets to buy and hold.',
        },
      ],
    },
    footer: 'Every simulation runs live in your browser — no backend, no tracking. An educational tool, not investment advice.',
    lang: { group: '語言 / Language', zh: '中', en: 'EN' },
  },
}

// Initial locale: honour a read-only ?lang= hint (so a hand-shared link can open
// in English), else fall back to the default. Read-only by design — see the
// URL-persistence note at the top of this file.
export function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const q = new URLSearchParams(window.location.search).get('lang')
  if (q === 'en') return 'en'
  if (q === 'zh-Hant' || q === 'zh') return 'zh-Hant'
  return DEFAULT_LOCALE
}
