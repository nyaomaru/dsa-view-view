import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines conditional class values and resolves Tailwind conflicts.
 *
 * @param inputs Class values accepted by clsx.
 * @returns A merged class-name string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
