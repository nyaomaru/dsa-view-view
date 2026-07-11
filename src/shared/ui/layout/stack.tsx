import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/class-names'

/**
 * Spacing size type based on Digital Agency design system
 */
export type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

/**
 * Alignment options for Stack
 */
export type StackAlign = 'start' | 'center' | 'end' | 'stretch'

/**
 * Props for Stack component
 */
type StackProps = {
  /** Spacing between child elements */
  spacing?: SpacingSize
  /** Horizontal alignment of children */
  align?: StackAlign
  /** Child elements */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Vertical layout component with consistent spacing
 *
 * Manages vertical spacing between child elements using
 * the Digital Agency design system spacing scale.
 *
 * @param props - Component props
 * @returns Stack component
 *
 * @example
 * ```tsx
 * <Stack spacing="md" align="start">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Stack>
 * ```
 */
export function Stack({
  spacing = 'md',
  align = 'stretch',
  children,
  className,
}: StackProps) {
  const alignClasses: Record<StackAlign, string> = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }

  return (
    <div
      className={cn(
        'flex flex-col',
        // Static spacing classes for Tailwind purging
        spacing === 'xs' && 'space-y-1',
        spacing === 'sm' && 'space-y-2',
        spacing === 'md' && 'space-y-4',
        spacing === 'lg' && 'space-y-6',
        spacing === 'xl' && 'space-y-8',
        spacing === '2xl' && 'space-y-12',
        spacing === '3xl' && 'space-y-16',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}
