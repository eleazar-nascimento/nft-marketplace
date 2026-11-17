import type { ErrorCode } from '@/contracts'

export class MockApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly fieldErrors?: Record<string, string>,
    readonly details?: Record<string, unknown>,
  ) {
    super(message)
  }

  toBody() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.fieldErrors ? { fieldErrors: this.fieldErrors } : {}),
        ...(this.details ? { details: this.details } : {}),
      },
    }
  }
}

export const errors = {
  validation: (fieldErrors: Record<string, string>, message = 'Verifique os campos destacados.') =>
    new MockApiError(422, 'VALIDATION_ERROR', message, fieldErrors),
  unauthenticated: () => new MockApiError(401, 'UNAUTHENTICATED', 'Faça login para continuar.'),
  sessionExpired: () => new MockApiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.'),
  forbidden: () => new MockApiError(403, 'FORBIDDEN', 'Você não tem permissão para acessar este recurso.'),
  notFound: (resource: string) => new MockApiError(404, 'NOT_FOUND', `${resource} não encontrado.`),
  conflict: (code: ErrorCode, message: string, details?: Record<string, unknown>, fieldErrors?: Record<string, string>) =>
    new MockApiError(409, code, message, fieldErrors, details),
  transient: (status = 503) =>
    new MockApiError(status, 'TRANSIENT', 'Serviço temporariamente indisponível. Tente novamente.'),
}

export function zodFieldErrors(issues: Array<{ path: PropertyKey[]; message: string }>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || 'form'
    if (!result[key]) result[key] = issue.message
  }
  return result
}
