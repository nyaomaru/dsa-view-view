import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/class-names'

const headingVariants = cva('font-bold tracking-tight text-foreground', {
  variants: {
    level: {
      1: 'text-3xl lg:text-4xl',
      2: 'text-2xl lg:text-3xl',
      3: 'text-xl lg:text-2xl',
      4: 'text-lg lg:text-xl',
    },
    variant: {
      default: '',
      gradient:
        'bg-gradient-to-r from-heading-gradient-from to-heading-gradient-to bg-clip-text text-transparent',
    },
  },
  defaultVariants: {
    level: 1,
    variant: 'default',
  },
})

/**
 * Props for Heading component
 */
export type HeadingProps = React.ComponentProps<'h1'> &
  VariantProps<typeof headingVariants> & {
    /** Heading level (1-4) */
    level?: 1 | 2 | 3 | 4
    /** Optional HTML tag override */
    as?: 'h1' | 'h2' | 'h3' | 'h4'
  }

const levelTagMap: Record<
  NonNullable<HeadingProps['level']>,
  NonNullable<HeadingProps['as']>
> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
}

const Heading = ({
  className,
  level = 1,
  variant,
  as,
  ref,
  ...props
}: HeadingProps) => {
  const Comp = as ?? levelTagMap[level]
  return (
    <Comp
      ref={ref}
      className={cn(headingVariants({ level, variant, className }))}
      {...props}
    />
  )
}
Heading.displayName = 'Heading'

export { Heading }
