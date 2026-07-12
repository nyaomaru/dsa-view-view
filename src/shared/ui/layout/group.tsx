import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/class-names'
import type { SpacingSize } from './stack'

/**
 * Vertical alignment options for Group
 */
export type GroupAlign = 'start' | 'center' | 'end' | 'baseline'

/**
 * Horizontal justification options for Group
 */
export type GroupJustify = 'start' | 'center' | 'end' | 'between' | 'around'

/**
 * Props for Group component
 */
type GroupProps = {
  /** Spacing between child elements */
  spacing?: SpacingSize
  /** Vertical alignment of children */
  align?: GroupAlign
  /** Horizontal justification of children */
  justify?: GroupJustify
  /** Allow wrapping to next line */
  wrap?: boolean
  /** Child elements */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Horizontal layout component with consistent spacing
 *
 * Manages horizontal spacing between child elements using
 * the Digital Agency design system spacing scale.
 *
 * @param props - Component props
 * @returns Group component
 *
 * @example
 * ```tsx
 * <Group spacing="sm" align="center" justify="between">
 *   <Button>Button 1</Button>
 *   <Button>Button 2</Button>
 * </Group>
 * ```
 */
export function Group({
  spacing = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
  children,
  className,
}: GroupProps) {
  const alignClasses: Record<GroupAlign, string> = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
  }

  const justifyClasses: Record<GroupJustify, string> = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  }

  return (
    <div
      className={cn(
        'flex',
        // Static spacing classes for Tailwind purging
        spacing === 'xs' && 'gap-1',
        spacing === 'sm' && 'gap-2',
        spacing === 'md' && 'gap-4',
        spacing === 'lg' && 'gap-6',
        spacing === 'xl' && 'gap-8',
        spacing === '2xl' && 'gap-12',
        spacing === '3xl' && 'gap-16',
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  )
}
