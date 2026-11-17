import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-[40px] w-full rounded-[4px] border border-border-subtle bg-bg-primary px-3.5 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-red-500',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'
