import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-mono font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default: 'bg-accent text-bg-primary hover:bg-accent-hover',
        secondary: 'bg-bg-secondary text-text-primary border border-border-subtle hover:bg-bg-elevated',
        outline: 'border border-accent bg-transparent text-accent-bright hover:bg-accent/15',
        ghost: 'bg-transparent text-text-primary hover:bg-bg-secondary',
        destructive: 'bg-red-700 text-white hover:bg-red-800',
      },
      size: {
        default: 'h-10 px-5 text-sm',
        sm: 'h-8.75 px-3.5 text-sm rounded-md',
        lg: 'h-11.25 px-6 text-base rounded-md',
        icon: 'h-8.75 w-8.75 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = 'button', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
