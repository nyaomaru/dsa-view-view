import * as React from 'react'

import { cn } from '@/shared/lib/class-names'

const Input = ({
  className,
  type,
  ref,
  ...props
}: React.ComponentProps<'input'>) => {
  return (
    <input
      type={type}
      className={cn(
        'pixel-field [--pixel-field-shell:rgb(var(--input))] [--pixel-field-fill:rgb(var(--background))] flex h-9 w-full border border-input px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      ref={ref}
      {...props}
    />
  )
}
Input.displayName = 'Input'

export { Input }
