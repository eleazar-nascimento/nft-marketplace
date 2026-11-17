import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { onUnauthorized } from '@/api/client'
import { authApi } from '@/api/endpoints'
import type { LoginRequest, RegisterRequest, Session, SessionUser } from '@/contracts'
import {
  clearUserStorage,
  readStoredSession,
  saveReturnTo,
  writeStoredSession,
} from '@/lib/storage'
import { useNotifications } from './notifications'

interface SessionContextValue {
  session: Session | null
  user: SessionUser | null
  scope: string
  status: 'checking' | 'authenticated' | 'anonymous'
  expiredNotice: string | null
  clearExpiredNotice: () => void
  login: (input: LoginRequest) => Promise<{ session: Session; mergedCartItems: number }>
  register: (input: RegisterRequest) => Promise<{ session: Session; mergedCartItems: number }>
  logout: () => Promise<void>
  updateSessionUser: (patch: Partial<SessionUser>) => void
  refreshSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { notify } = useNotifications()
  const [session, setSession] = useState<Session | null>(() => readStoredSession())
  const [status, setStatus] = useState<'checking' | 'authenticated' | 'anonymous'>(() =>
    readStoredSession() ? 'checking' : 'anonymous',
  )
  const [expiredNotice, setExpiredNotice] = useState<string | null>(null)
  const currentUserIdRef = useRef<string | null>(session?.user.id ?? null)

  useEffect(() => {
    currentUserIdRef.current = session?.user.id ?? null
  }, [session])

  const purgePrivateCache = useCallback(
    (userId: string | null, keepCheckoutDraft = false) => {
      queryClient.removeQueries({ queryKey: ['private'] })
      if (userId) {
        queryClient.removeQueries({ queryKey: ['cart', userId] })
        queryClient.removeQueries({ queryKey: ['quote', userId] })
        if (!keepCheckoutDraft) {
          clearUserStorage(userId)
        }
      }
    },
    [queryClient],
  )

  const handleSessionExpired = useCallback(() => {
    const previousUserId = currentUserIdRef.current
    writeStoredSession(null)
    setSession(null)
    setStatus('anonymous')
    purgePrivateCache(previousUserId, true)
    const currentPath = `${window.location.pathname}${window.location.search}`
    saveReturnTo(currentPath)
    const message = 'Sua sessão expirou. Entre novamente para retomar de onde parou.'
    setExpiredNotice(message)
    notify({
      tone: 'warning',
      title: 'Sessão expirada',
      description: message,
    })
  }, [notify, purgePrivateCache])

  const refreshSession = useCallback(async () => {
    await Promise.resolve()
    const stored = readStoredSession()
    if (!stored) {
      setSession(null)
      setStatus('anonymous')
      return
    }
    try {
      const info = await authApi.getSession()
      const updated: Session = {
        token: stored.token,
        expiresAt: info.expiresAt,
        user: info.user,
      }
      writeStoredSession(updated)
      setSession(updated)
      setStatus('authenticated')
    } catch {
      handleSessionExpired()
    }
  }, [handleSessionExpired])

  useEffect(() => {
    if (!readStoredSession()) return
    const timer = setTimeout(() => {
      void refreshSession()
    }, 0)
    return () => clearTimeout(timer)
  }, [refreshSession])

  useEffect(() => {
    return onUnauthorized(() => {
      if (readStoredSession() || currentUserIdRef.current) {
        handleSessionExpired()
      }
    })
  }, [handleSessionExpired])

  useEffect(() => {
    if (!session) return
    const msUntilExpiry = Date.parse(session.expiresAt) - Date.now()
    const delayMs = Math.max(0, Math.min(msUntilExpiry + 150, 2_147_483_647))
    const timer = setTimeout(() => {
      void refreshSession()
    }, delayMs)
    return () => clearTimeout(timer)
  }, [session, refreshSession])

  const applyAuthenticatedSession = useCallback(
    async (next: Session, mergedCartItems: number) => {
      const previousUserId = currentUserIdRef.current
      if (previousUserId && previousUserId !== next.user.id) {
        purgePrivateCache(previousUserId, false)
      }
      writeStoredSession(next)
      setSession(next)
      setStatus('authenticated')
      setExpiredNotice(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cart'] }),
        queryClient.invalidateQueries({ queryKey: ['quote'] }),
      ])
      if (mergedCartItems > 0) {
        notify({
          tone: 'info',
          title: 'Carrinho sincronizado',
          description: `${mergedCartItems} ${mergedCartItems === 1 ? 'item foi mantido' : 'itens foram mantidos'} no seu carrinho.`,
        })
      }
    },
    [notify, purgePrivateCache, queryClient],
  )

  const login = useCallback(
    async (input: LoginRequest) => {
      const result = await authApi.login(input)
      await applyAuthenticatedSession(result.session, result.mergedCartItems)
      return result
    },
    [applyAuthenticatedSession],
  )

  const register = useCallback(
    async (input: RegisterRequest) => {
      const result = await authApi.register(input)
      await applyAuthenticatedSession(result.session, result.mergedCartItems)
      return result
    },
    [applyAuthenticatedSession],
  )

  const logout = useCallback(async () => {
    const previousUserId = currentUserIdRef.current
    try {
      await authApi.logout()
    } catch {
      void 0
    }
    writeStoredSession(null)
    setSession(null)
    setStatus('anonymous')
    setExpiredNotice(null)
    purgePrivateCache(previousUserId, false)
    await queryClient.invalidateQueries({ queryKey: ['cart', 'guest'] })
  }, [purgePrivateCache, queryClient])

  const updateSessionUser = useCallback((patch: Partial<SessionUser>) => {
    setSession((current) => {
      if (!current) return null
      const updated: Session = {
        ...current,
        user: { ...current.user, ...patch },
      }
      writeStoredSession(updated)
      return updated
    })
  }, [])

  const clearExpiredNotice = useCallback(() => {
    setExpiredNotice(null)
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      scope: session?.user.id ?? 'guest',
      status,
      expiredNotice,
      clearExpiredNotice,
      login,
      register,
      logout,
      updateSessionUser,
      refreshSession,
    }),
    [
      session,
      status,
      expiredNotice,
      clearExpiredNotice,
      login,
      register,
      logout,
      updateSessionUser,
      refreshSession,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
