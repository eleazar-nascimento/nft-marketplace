import type { LoginRequest, RegisterRequest, Session } from '@/contracts'
import { store } from '../db/store'
import type { SessionRecord, UserRecord } from '../db/schema'
import { hashPassword, verifyPassword } from '../lib/crypto'
import { createId, createToken } from '../lib/random'
import { scenario } from '../scenarios'
import { errors } from './errors'
import { toSessionUser } from './mappers'

function nowIso(): string {
  return new Date().toISOString()
}

function createSession(user: UserRecord): Session {
  const createdAt = Date.now()
  const record: SessionRecord = {
    token: createToken(),
    userId: user.id,
    createdAt: new Date(createdAt).toISOString(),
    expiresAt: new Date(createdAt + scenario.current.sessionTtlMs).toISOString(),
  }
  store.data.sessions = store.data.sessions.filter((session) => Date.parse(session.expiresAt) > createdAt - 86_400_000)
  store.data.sessions.push(record)
  return { token: record.token, expiresAt: record.expiresAt, user: toSessionUser(user) }
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const normalized = email.trim().toLowerCase()
  return store.data.users.find((user) => user.email.toLowerCase() === normalized)
}

export async function register(input: RegisterRequest): Promise<{ session: Session; user: UserRecord }> {
  const fieldErrors: Record<string, string> = {}
  if (findUserByEmail(input.email)) fieldErrors.email = 'Este e-mail já está cadastrado.'
  if (store.data.users.some((user) => user.username === input.username)) {
    fieldErrors.username = 'Este nome de usuário já está em uso.'
  }
  if (fieldErrors.email || fieldErrors.username) {
    throw errors.conflict(
      fieldErrors.email ? 'EMAIL_TAKEN' : 'USERNAME_TAKEN',
      'Já existe uma conta com estes dados.',
      undefined,
      fieldErrors,
    )
  }
  const { hash, salt } = await hashPassword(input.password)
  const timestamp = nowIso()
  const user: UserRecord = {
    id: createId('usr'),
    name: input.name.trim(),
    username: input.username,
    email: input.email.trim().toLowerCase(),
    passwordHash: hash,
    passwordSalt: salt,
    bio: '',
    website: '',
    avatarUrl: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  store.data.users.push(user)
  store.data.favorites[user.id] = []
  return { session: createSession(user), user }
}

export async function login(input: LoginRequest): Promise<{ session: Session; user: UserRecord }> {
  const user = findUserByEmail(input.email)
  const valid = user ? await verifyPassword(input.password, user.passwordHash, user.passwordSalt) : false
  if (!user || !valid) {
    throw errors.conflict('INVALID_CREDENTIALS', 'E-mail ou senha incorretos.', undefined, {
      password: 'E-mail ou senha incorretos.',
    })
  }
  return { session: createSession(user), user }
}

export function resolveSession(token: string | null): { session: SessionRecord; user: UserRecord } {
  if (!token) throw errors.unauthenticated()
  const session = store.data.sessions.find((candidate) => candidate.token === token)
  if (!session) throw errors.unauthenticated()
  if (Date.parse(session.expiresAt) <= Date.now()) throw errors.sessionExpired()
  const user = store.data.users.find((candidate) => candidate.id === session.userId)
  if (!user) throw errors.unauthenticated()
  return { session, user }
}

export function tryResolveSession(token: string | null): { session: SessionRecord; user: UserRecord } | null {
  try {
    return resolveSession(token)
  } catch {
    return null
  }
}

export function logout(token: string | null): void {
  store.data.sessions = store.data.sessions.filter((session) => session.token !== token)
}

export function expireSessions(userId?: string): number {
  const now = Date.now()
  let count = 0
  store.data.sessions.forEach((session) => {
    if (!userId || session.userId === userId) {
      session.expiresAt = new Date(now - 1000).toISOString()
      count += 1
    }
  })
  return count
}
