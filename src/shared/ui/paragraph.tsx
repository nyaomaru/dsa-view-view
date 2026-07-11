import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/class-names'

const paragraphVariants = cva('leading-7', {
  variants: {
    size: {
      default: 'text-base',
      sm: 'text-sm',
      lg: 'text-lg font-semibold',
    },
    variant: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
})

/**
 * Props for Paragraph component
 */
export type ParagraphProps = React.ComponentProps<'p'> &
  VariantProps<typeof paragraphVariants> & {
    /** Whether to render as a Radix Slot */
    asChild?: boolean
  }

const Paragraph = ({
  className,
  size,
  variant,
  ref,
  ...props
}: ParagraphProps) => {
  return (
    <p
      ref={ref}
      className={cn(paragraphVariants({ size, variant, className }))}
      {...props}
    />
  )
}
Paragraph.displayName = 'Paragraph'

export { Paragraph }
