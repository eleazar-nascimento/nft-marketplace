import type { ZodError } from 'zod'

export function zodIssuesToFieldErrors(error: ZodError): Record<string, string> {
  const next: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!next[key]) {
      next[key] = issue.message
    }
  }
  return next
}

export function formatTokenNumber(nftId: string): string {
  return nftId.replace(/\D/g, '').padStart(4, '0')
}

export function createIdempotencyKey(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return `idem_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}
