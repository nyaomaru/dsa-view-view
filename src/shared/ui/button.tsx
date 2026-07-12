import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib/class-names'

const buttonVariants = cva(
  'pixel-button inline-flex cursor-pointer items-center justify-center whitespace-nowrap border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          '[--pixel-button-color:rgb(var(--primary))] [--pixel-button-fill:rgb(var(--background))] text-primary shadow hover:[--pixel-button-fill:rgb(var(--primary))] hover:text-background font-bold',
        secondary:
          '[--pixel-button-color:rgb(var(--secondary) / var(--secondary-alpha))] [--pixel-button-fill:rgb(var(--background))] text-secondary-foreground hover:[--pixel-button-fill:rgb(var(--secondary) / 0.12)]',
        outline:
          '[--pixel-button-color:rgb(var(--primary))] [--pixel-button-fill:rgb(var(--background))] text-primary hover:[--pixel-button-fill:rgb(var(--primary) / 0.1)]',
        ghost:
          '[--pixel-button-color:rgb(var(--input))] [--pixel-button-fill:rgb(var(--background))] text-foreground hover:[--pixel-button-fill:rgb(var(--accent))] hover:text-accent-foreground',
        link: '[--pixel-button-color:rgb(var(--primary))] [--pixel-button-fill:rgb(var(--background))] text-primary underline-offset-4 hover:[--pixel-button-fill:rgb(var(--primary) / 0.08)] hover:underline',
        destructive:
          '[--pixel-button-color:rgb(var(--destructive))] [--pixel-button-fill:rgb(var(--background))] text-destructive shadow hover:[--pixel-button-fill:rgb(var(--destructive) / 0.12)]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 py-1.5',
        lg: 'h-10 px-8 py-2.5',
        icon: 'h-9 w-9 px-0 py-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

/**
 * Props for Button component
 */
export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Whether to render the button as a Radix Slot */
    asChild?: boolean
  }

const Button = ({
  className,
  variant,
  size,
  asChild = false,
  ref,
  children,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : 'button'
  const pixelVariant = `pixel-button--${variant ?? 'default'}`

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }), pixelVariant)}
      ref={ref}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <span className="pixel-button__content" style={{ gap: 'inherit' }}>
          {children}
        </span>
      )}
    </Comp>
  )
}
Button.displayName = 'Button'

export { Button }
