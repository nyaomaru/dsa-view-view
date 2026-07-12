import { isNull, isString, isUndefined } from '@/shared/lib/guards'
import { safeStringify } from '@/shared/lib/safe-stringify'

/**
 * Formatting options for converting unknown runtime values into short UI text.
 */
export type DisplayValueOptions = {
  /** Whether string values should be wrapped in quotes. */
  quoteStrings?: boolean
  /** Label to use for null values. */
  nullLabel?: string
  /** Label to use for undefined values. */
  undefinedLabel?: string
}

/**
 * Formats a runtime value for compact labels in visualizers.
 */
export function formatDisplayValue(
  value: unknown,
  {
    quoteStrings = false,
    nullLabel = '',
    undefinedLabel = '',
  }: DisplayValueOptions = {}
): string {
  if (isNull(value)) return nullLabel
  if (isUndefined(value)) return undefinedLabel
  if (value === Infinity) return '∞'
  if (value === -Infinity) return '-∞'
  if (isString(value)) return quoteStrings ? `"${value}"` : value

  return safeStringify(value)
}
