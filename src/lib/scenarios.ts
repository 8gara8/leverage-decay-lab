// Scenario configuration map + slider semantics (SPEC.md §7).
// Values ported from the reference prototype table.

import type { Scenario } from './sim'

export interface ScenarioConfig {
  scenario: Scenario
  swingName: string // zh-Hant label, e.g. "年化波動度 σ"
  unit: '%'
  min: number
  max: number
  step: number
  def: number // default slider value
  hint: string // zh-Hant helper text
  showStart: boolean // textbook only: show 先漲後跌 / 先跌後漲 toggle
  showReshuffle: boolean // random only: show 🎲 reshuffle
}

export const SCENARIO_ORDER: Scenario[] = [
  'choppyFlat',
  'upChoppy',
  'barelyBetter',
  'crash',
  'calmUp',
  'random',
  'textbook',
]

export const CONFIG: Record<Scenario, ScenarioConfig> = {
  choppyFlat: {
    scenario: 'choppyFlat',
    swingName: '年化波動度 σ',
    unit: '%',
    min: 10,
    max: 80,
    step: 5,
    def: 40,
    hint: '大盤上下震盪、最後回到原點，槓桿卻被來回的波動磨掉。',
    showStart: false,
    showReshuffle: false,
  },
  upChoppy: {
    scenario: 'upChoppy',
    swingName: '年化波動度 σ',
    unit: '%',
    min: 10,
    max: 80,
    step: 5,
    def: 50,
    hint: '大盤一年約漲 10%，但路上很顛簸，2x 反而追不上大盤。',
    showStart: false,
    showReshuffle: false,
  },
  barelyBetter: {
    scenario: 'barelyBetter',
    swingName: '年化波動度 σ',
    unit: '%',
    min: 15,
    max: 45,
    step: 5,
    def: 30,
    hint: '大盤一年約漲 9%；當 σ≈30% 時槓桿幾乎打平大盤，多扛的風險卻不划算。',
    showStart: false,
    showReshuffle: false,
  },
  crash: {
    scenario: 'crash',
    swingName: '崩盤深度',
    unit: '%',
    min: 10,
    max: 60,
    step: 5,
    def: 35,
    hint: '先崩盤再部分反彈，槓桿的最大跌幅遠比大盤深，回本更難。',
    showStart: false,
    showReshuffle: false,
  },
  calmUp: {
    scenario: 'calmUp',
    swingName: '年化漲幅',
    unit: '%',
    min: 4,
    max: 25,
    step: 1,
    def: 12,
    hint: '低波動、穩定上漲——這種情境下槓桿才真的有利（誠實的反例）。',
    showStart: false,
    showReshuffle: false,
  },
  random: {
    scenario: 'random',
    swingName: '年化波動度 σ',
    unit: '%',
    min: 10,
    max: 80,
    step: 5,
    def: 30,
    hint: '蒙地卡羅：600 條隨機路徑，看「典型」結果與輸給大盤的機率。',
    showStart: false,
    showReshuffle: true,
  },
  textbook: {
    scenario: 'textbook',
    swingName: '上漲日漲幅 u',
    unit: '%',
    min: 0.5,
    max: 8,
    step: 0.5,
    def: 3,
    hint: '教科書級的完美交替：下跌日的幅度剛好讓 2x 最後打平。',
    showStart: true,
    showReshuffle: false,
  },
}
