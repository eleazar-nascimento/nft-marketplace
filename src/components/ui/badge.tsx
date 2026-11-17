import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-medium',
  {
    variants: {
      variant: {
        default: 'bg-bg-primary text-text-secondary border border-border-subtle',
        accent: 'bg-accent/25 text-white border border-accent-bright',
        success: 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/60',
        warning: 'bg-amber-950/90 text-amber-200 border border-amber-500/60',
        danger: 'bg-red-950/90 text-red-200 border border-red-500/60',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
