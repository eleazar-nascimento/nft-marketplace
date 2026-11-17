import axios, { AxiosError } from 'axios'
import type { ApiErrorBody, ErrorCode } from '@/contracts'
import { getGuestCartId, readStoredSession } from '@/lib/storage'

export class AppApiError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly fieldErrors?: Record<string, string>
  readonly details?: Record<string, unknown>

  constructor(options: {
    status: number
    code: ErrorCode
    message: string
    fieldErrors?: Record<string, string>
    details?: Record<string, unknown>
  }) {
    super(options.message)
    this.name = 'AppApiError'
    this.status = options.status
    this.code = options.code
    this.fieldErrors = options.fieldErrors
    this.details = options.details
  }
}

type UnauthorizedListener = (reason: 'UNAUTHENTICATED' | 'SESSION_EXPIRED') => void

const unauthorizedListeners = new Set<UnauthorizedListener>()

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

export const httpClient = axios.create({
  baseURL: '/api',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
})

httpClient.interceptors.request.use((config) => {
  const session = readStoredSession()
  config.headers.set('X-Guest-Cart-Id', getGuestCartId())
  if (session?.token) {
    config.headers.set('Authorization', `Bearer ${session.token}`)
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(
          new AppApiError({
            status: 504,
            code: 'TIMEOUT',
            message: 'A requisição excedeu o tempo limite. Tente novamente.',
          }),
        )
      }

      if (!error.response) {
        return Promise.reject(
          new AppApiError({
            status: 0,
            code: 'NETWORK_ERROR',
            message: 'Falha de conexão com o servidor. Verifique sua rede e tente novamente.',
          }),
        )
      }

      const status = error.response.status
      const body = error.response.data as Partial<ApiErrorBody> | undefined
      const code = body?.error?.code ?? (status === 401 ? 'UNAUTHENTICATED' : 'UNKNOWN')
      const message = body?.error?.message ?? 'Ocorreu um erro ao processar sua solicitação.'

      if (status === 401 && (code === 'SESSION_EXPIRED' || code === 'UNAUTHENTICATED')) {
        const hadToken = Boolean(error.config?.headers?.get?.('Authorization') ?? error.config?.headers?.Authorization)
        if (hadToken) {
          unauthorizedListeners.forEach((listener) => listener(code))
        }
      }

      return Promise.reject(
        new AppApiError({
          status,
          code,
          message,
          fieldErrors: body?.error?.fieldErrors,
          details: body?.error?.details,
        }),
      )
    }

    return Promise.reject(
      new AppApiError({
        status: 500,
        code: 'UNKNOWN',
        message: 'Erro inesperado.',
      }),
    )
  },
)
