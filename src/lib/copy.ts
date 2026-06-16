// zh-Hant user-facing copy: scenario titles/subtitles + narrative generators
// (SPEC.md §7). The reference prototype (`reference/legacy.html`) was not handed
// to the build, so this wording is written fresh to match SPEC.md's framing and
// the existing hints in `scenarios.ts`. Keep the "ETF vs 大盤" framing; do NOT
// reintroduce any "天真期望 / naive expectation" concept (SPEC.md §7). When
// legacy.html becomes available, reconcile the exact wording against it.

import type { AnyResult, Scenario, SimState } from './sim'
import { pct, pctAbs } from './format'

// Short card title per scenario.
export const TITLE: Record<Scenario, string> = {
  choppyFlat: '震盪盤整',
  upChoppy: '上漲卻震盪',
  barelyBetter: '勉強打平',
  crash: '崩盤重挫',
  calmUp: '平穩上漲',
  random: '隨機市場',
  textbook: '教科書範例',
}

// One-line subtitle that hints at the lesson.
export const SUBTITLE: Record<Scenario, string> = {
  choppyFlat: '大盤原地踏步，槓桿卻虧錢',
  upChoppy: '大盤一年漲 10%，2x 反而輸',
  barelyBetter: '多扛一倍風險，卻幾乎沒多賺',
  crash: '槓桿跌得更深、更難回本',
  calmUp: '誠實的反例：這時槓桿才有利',
  random: '600 條隨機路徑的「典型」結果',
  textbook: '完美交替，2x 最後剛好打平',
}

// SPEC.md §8.6 — the 3-step guided walkthrough. Each step auto-selects a
// scenario and explains one "aha": chop drags a flat market down, an
// up-but-volatile market still loses, and only a calm uptrend rewards leverage.
export interface StoryStep {
  scenario: Scenario
  body: string
}

export const STORY_STEPS: StoryStep[] = [
  {
    scenario: 'choppyFlat',
    body: '大盤上上下下、最後回到原點，2x ETF 卻在來回震盪間被一刀刀磨掉，變成虧錢。這就是「波動度衰減」。',
  },
  {
    scenario: 'upChoppy',
    body: '就算大盤一年漲約 10%，只要路上夠顛簸，2x ETF 仍會輸給大盤——顛簸的路把多出來的報酬偷走了。',
  },
  {
    scenario: 'calmUp',
    body: '誠實的反例：當行情穩穩上漲、波動很低時，每日複利反而對槓桿有利，這時候 2x 才真的贏過大盤。',
  },
]

export interface Narrative {
  cls: 'red' | 'green'
  html: string
}

// The headline result sentence — what actually happened, in plain language.
export function resultSentence(state: SimState, result: AnyResult): Narrative {
  const { L, scenario } = state
  const win = result.diff >= 0

  if (scenario === 'random' && result.mc) {
    const pLose = 1 - result.mc.pBeat1x
    return {
      cls: win ? 'green' : 'red',
      html:
        `在 <b>${result.mc.nPaths}</b> 條隨機路徑中，<b>典型（中位數）</b>的結局是：` +
        `大盤 ${pct(result.idxR)}、${L}x ETF <b>${pct(result.levR)}</b>。` +
        `其中有 <b>${pctAbs(pLose, 0)}</b> 的路徑最後<b>輸給大盤</b>—— ` +
        `把運氣打開，多數時候槓桿仍落後。`,
    }
  }

  const idxText =
    result.idxR >= 0 ? `漲了 ${pct(result.idxR)}` : `跌了 ${pctAbs(result.idxR)}`

  if (win) {
    return {
      cls: 'green',
      html:
        `這個情境下，大盤${idxText}，<b>${L}x ETF 來到 ${pct(result.levR)}</b>，` +
        `比直接買大盤<b>多賺了 ${pctAbs(result.diff)}</b>。` +
        `但別忘了——你扛的是 ${L} 倍的波動與更深的回檔。`,
    }
  }

  return {
    cls: 'red',
    html:
      `在這個情境下，大盤${idxText}，<b>${L}x ETF 卻只有 ${pct(result.levR)}</b>，` +
      `和直接買大盤相比<b>少賺了 ${pctAbs(result.diff)}</b>—— 不如直接買大盤。`,
  }
}

// The "why" — the intuition behind the number, keyed per scenario.
const INTUITION: Record<Scenario, (L: number) => string> = {
  choppyFlat: (L) =>
    `槓桿追蹤的是<b>每日</b>報酬。當大盤上下來回、最後回到原點時，跌一段要漲更多才能回本；` +
    `放大 ${L} 倍後這個缺口更大，於是大盤原地踏步、ETF 卻被一刀一刀磨掉——這就是<b>波動度衰減</b>。`,
  upChoppy: (L) =>
    `就算大盤整體往上，<b>顛簸的路徑</b>仍會偷走槓桿的報酬。每天放大 ${L} 倍，` +
    `波動造成的損耗（隨 σ² 成長）往往吃掉、甚至超過多出來的那點漲幅。`,
  barelyBetter: (L) =>
    `這裡槓桿幾乎打平大盤：多出來的漲幅恰好被波動損耗抵銷。重點是——你多扛了 ${L} 倍的風險，` +
    `卻沒換到對等的報酬，並不划算。`,
  crash: (L) =>
    `下跌時槓桿同樣被放大。崩盤讓 ${L}x ETF 跌得更深，而越深的坑越難爬出來` +
    `（跌 50% 要漲 100% 才回本），所以即使反彈，它仍遠遠落後大盤。`,
  calmUp: (L) =>
    `<b>誠實的反例</b>：當趨勢穩定、波動很低時，每日複利反而對槓桿有利，${L}x ETF 確實能贏過大盤。` +
    `槓桿適合這種「穩穩向上」的環境——可惜真實市場很少這麼乖。`,
  random: (L) =>
    `把隨機性打開：多數路徑裡，波動損耗讓 ${L}x ETF 落後大盤。少數順風的路徑能贏，` +
    `但「典型」結果是輸——這正是長期持有槓桿最真實的樣貌。`,
  textbook: (L) =>
    `教科書情境：下跌日的幅度被刻意設定成讓 2x 最後<b>剛好打平</b>。` +
    `它讓你一眼看清——只要路上有來回波動，${L} 倍槓桿的終點就會低於「整段報酬 × ${L}」的直覺。`,
}

// The intuition callout. Colour follows reality (green only when leverage wins).
export function intuition(state: SimState, result: AnyResult): Narrative {
  return {
    cls: result.diff >= 0 ? 'green' : 'red',
    html: INTUITION[state.scenario](state.L),
  }
}
