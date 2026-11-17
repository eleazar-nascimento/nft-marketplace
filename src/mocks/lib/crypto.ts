import { randomHex } from './random'

async function digest(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt = randomHex(16)) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 60_000, hash: 'SHA-256' },
    key,
    256,
  )
  const hash = Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return { hash, salt }
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const result = await hashPassword(password, salt)
  return result.hash === hash
}

export async function fingerprint(value: unknown): Promise<string> {
  return (await digest(JSON.stringify(value))).slice(0, 24)
}
