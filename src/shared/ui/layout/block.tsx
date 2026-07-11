import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/class-names'
import type { SpacingSize } from './stack'

/**
 * Props for Block component
 */
type BlockProps = {
  /** Padding size for all sides */
  padding?: SpacingSize
  /** Horizontal padding (overrides padding) */
  paddingX?: SpacingSize
  /** Vertical padding (overrides padding) */
  paddingY?: SpacingSize
  /** Child elements */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Block component for padding management
 *
 * Wraps content with consistent padding using the
 * Digital Agency design system spacing scale.
 *
 * @param props - Component props
 * @returns Block component
 *
 * @example
 * ```tsx
 * <Block padding="lg">
 *   <Content />
 * </Block>
 *
 * <Block paddingX="md" paddingY="sm">
 *   <Content />
 * </Block>
 * ```
 */
export function Block({
  padding,
  paddingX,
  paddingY,
  children,
  className,
}: BlockProps) {
  return (
    <div
      className={cn(
        // Static padding classes for Tailwind purging
        padding === 'xs' && 'p-1',
        padding === 'sm' && 'p-2',
        padding === 'md' && 'p-4',
        padding === 'lg' && 'p-6',
        padding === 'xl' && 'p-8',
        padding === '2xl' && 'p-12',
        padding === '3xl' && 'p-16',
        // Horizontal padding
        paddingX === 'xs' && 'px-1',
        paddingX === 'sm' && 'px-2',
        paddingX === 'md' && 'px-4',
        paddingX === 'lg' && 'px-6',
        paddingX === 'xl' && 'px-8',
        paddingX === '2xl' && 'px-12',
        paddingX === '3xl' && 'px-16',
        // Vertical padding
        paddingY === 'xs' && 'py-1',
        paddingY === 'sm' && 'py-2',
        paddingY === 'md' && 'py-4',
        paddingY === 'lg' && 'py-6',
        paddingY === 'xl' && 'py-8',
        paddingY === '2xl' && 'py-12',
        paddingY === '3xl' && 'py-16',
        className
      )}
    >
      {children}
    </div>
  )
}
