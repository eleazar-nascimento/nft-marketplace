const DECIMALS = 18
const SCALE = 10n ** BigInt(DECIMALS)

export type Wei = bigint

export function toWei(value: string): Wei {
  const trimmed = value.trim()
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid ETH amount: ${value}`)
  }
  const [whole = '0', fraction = ''] = trimmed.split('.')
  if (fraction.length > DECIMALS) {
    throw new Error(`ETH amount exceeds ${DECIMALS} decimals: ${value}`)
  }
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(DECIMALS, '0') || '0')
}

export function fromWei(wei: Wei): string {
  const negative = wei < 0n
  const absolute = negative ? -wei : wei
  const whole = absolute / SCALE
  const fraction = (absolute % SCALE).toString().padStart(DECIMALS, '0').replace(/0+$/, '')
  const result = fraction ? `${whole}.${fraction}` : whole.toString()
  return negative ? `-${result}` : result
}

export function addEth(...values: string[]): string {
  return fromWei(values.reduce((sum, value) => sum + toWei(value), 0n))
}

export function subEth(a: string, b: string): string {
  return fromWei(toWei(a) - toWei(b))
}

export function mulEth(value: string, quantity: number): string {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`Quantity must be a non-negative integer: ${quantity}`)
  }
  return fromWei(toWei(value) * BigInt(quantity))
}

export function percentOfEth(value: string, percent: number): string {
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new Error(`Percent must be an integer between 0 and 100: ${percent}`)
  }
  return fromWei((toWei(value) * BigInt(percent)) / 100n)
}

export function compareEth(a: string, b: string): -1 | 0 | 1 {
  const diff = toWei(a) - toWei(b)
  if (diff === 0n) return 0
  return diff > 0n ? 1 : -1
}

export function maxEth(a: string, b: string): string {
  return compareEth(a, b) >= 0 ? a : b
}

export function isZeroEth(value: string): boolean {
  return toWei(value) === 0n
}

export function formatEth(value: string, options: { maxDecimals?: number; withSymbol?: boolean } = {}): string {
  const { maxDecimals = 4, withSymbol = true } = options
  const wei = toWei(value)
  const unit = 10n ** BigInt(DECIMALS - maxDecimals)
  const rounded = (wei + unit / 2n) / unit
  const whole = rounded / 10n ** BigInt(maxDecimals)
  const fraction = (rounded % 10n ** BigInt(maxDecimals)).toString().padStart(maxDecimals, '0').replace(/0+$/, '')
  const wholeFormatted = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const isTinyNonZero = wei > 0n && rounded === 0n
  const body = isTinyNonZero ? `< 0,${'0'.repeat(maxDecimals - 1)}1` : fraction ? `${wholeFormatted},${fraction}` : wholeFormatted
  return withSymbol ? `${body} ETH` : body
}
