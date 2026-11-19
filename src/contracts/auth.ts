import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(64, 'A senha deve ter no máximo 64 caracteres')
  .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula')
  .regex(/[a-z]/, 'Inclua ao menos uma letra minúscula')
  .regex(/\d/, 'Inclua ao menos um número')

export const emailSchema = z.string().trim().min(1, 'Informe seu e-mail').pipe(z.email('E-mail inválido'))

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Use pelo menos 3 caracteres')
  .max(24, 'Use no máximo 24 caracteres')
  .regex(/^[a-z0-9_]+$/, 'Use apenas letras minúsculas, números e _')

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha'),
})

export type LoginRequest = z.infer<typeof loginRequestSchema>

export const registerRequestSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome').max(60, 'Use no máximo 60 caracteres').optional(),
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })

export type RegisterRequest = z.infer<typeof registerRequestSchema>

export interface SessionUser {
  id: string
  name: string
  username: string
  email: string
  avatarUrl: string | null
}

export interface Session {
  token: string
  expiresAt: string
  user: SessionUser
}

export interface SessionInfo {
  expiresAt: string
  user: SessionUser
}

export interface AuthResponse {
  session: Session
  mergedCartItems: number
}
