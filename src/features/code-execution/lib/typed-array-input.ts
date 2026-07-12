import { isArray } from '@/shared/lib/guards'

export function parseTypedArrayInput(value: string): unknown[] {
  const trimmed = value.trim()
  if (trimmed === '') return []

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const parsed = JSON.parse(trimmed)
    return isArray(parsed) ? [...parsed] : [parsed]
  }

  return trimmed.split(',').map((token) => token.trim())
}
