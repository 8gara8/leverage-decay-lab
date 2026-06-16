// Number formatters (SPEC.md §3 lib/format.ts).

// Signed percentage, e.g. 0.1234 -> "+12.3%", -0.05 -> "-5.0%".
export function pct(x: number, digits = 1): string {
  const sign = x > 0 ? '+' : ''
  return `${sign}${(x * 100).toFixed(digits)}%`
}

// Unsigned (absolute) percentage, e.g. -0.64 -> "64.0%". Used for drawdowns.
export function pctAbs(x: number, digits = 1): string {
  return `${(Math.abs(x) * 100).toFixed(digits)}%`
}

// Plain number with fixed decimals, e.g. 100.5 -> "100.5".
export function num(x: number, digits = 1): string {
  return x.toFixed(digits)
}
