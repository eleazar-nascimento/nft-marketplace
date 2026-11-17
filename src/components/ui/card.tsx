import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-[20px] bg-bg-secondary text-white border border-border-subtle/70', className)}
      {...props}
    />
  ),
)
Card.displayName = 'Card'
