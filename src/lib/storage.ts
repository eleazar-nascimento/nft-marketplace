import type { Collector, Network, Session } from '@/contracts'

const SESSION_KEY = 'nftm:session'
const GUEST_CART_KEY = 'nftm:guestCartId'
const RETURN_TO_KEY = 'nftm:returnTo'
const CHECKOUT_DRAFT_KEY = 'nftm:checkoutDraft'

export interface CheckoutDraft {
  collector: Collector
  walletId: string
  network: Network
  idempotencyKey?: string
  pendingOrderId?: string
}

export function getGuestCartId(): string {
  try {
    const existing = localStorage.getItem(GUEST_CART_KEY)
    if (existing) return existing
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    const created = `guest_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
    localStorage.setItem(GUEST_CART_KEY, created)
    return created
  } catch {
    return 'guest_default'
  }
}

export function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (!parsed?.token || !parsed?.user?.id) return null
    return parsed
  } catch {
    return null
  }
}

export function writeStoredSession(session: Session | null): void {
  try {
    if (!session) {
      localStorage.removeItem(SESSION_KEY)
    } else {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }
  } catch {
    return
  }
}

export function saveReturnTo(path: string): void {
  try {
    if (!path || path.startsWith('/login') || path.startsWith('/register')) return
    sessionStorage.setItem(RETURN_TO_KEY, path)
  } catch {
    return
  }
}

export function peekReturnTo(): string | null {
  try {
    return sessionStorage.getItem(RETURN_TO_KEY)
  } catch {
    return null
  }
}

export function consumeReturnTo(): string | null {
  try {
    const value = sessionStorage.getItem(RETURN_TO_KEY)
    sessionStorage.removeItem(RETURN_TO_KEY)
    return value
  } catch {
    return null
  }
}

export function readCheckoutDraft(userId: string): CheckoutDraft | null {
  try {
    const raw = sessionStorage.getItem(`${CHECKOUT_DRAFT_KEY}:${userId}`)
    return raw ? (JSON.parse(raw) as CheckoutDraft) : null
  } catch {
    return null
  }
}

export function writeCheckoutDraft(userId: string, draft: CheckoutDraft | null): void {
  try {
    const key = `${CHECKOUT_DRAFT_KEY}:${userId}`
    if (!draft) {
      sessionStorage.removeItem(key)
    } else {
      sessionStorage.setItem(key, JSON.stringify(draft))
    }
  } catch {
    return
  }
}

export function clearUserStorage(userId: string): void {
  try {
    sessionStorage.removeItem(`${CHECKOUT_DRAFT_KEY}:${userId}`)
  } catch {
    return
  }
}
