import {
  define,
  hasKey,
  hasKeys,
  isArray,
  isInteger,
  isNil,
  isNull,
  isNonArrayObject,
  isObject,
  isString,
  isUndefined,
  or,
  type Guard,
} from '@/shared/lib/guards'
import {
  parsePrimitiveToken,
  splitCommaSeparatedTokens,
  unwrapQuotedString,
} from './tree-node'

/**
 * Runtime linked-list node shape prepared for user algorithms.
 */
export type ListNodeValue = {
  /** Node value. */
  val: unknown
  /** Next node in the list, or null at the tail. */
  next: ListNodeValue | null
}

/**
 * Row descriptor from the structured ListNode input form.
 */
type ListNodeFormRow = {
  /** Optional node value. */
  val?: unknown
}

/**
 * Structured ListNode input descriptor accepted by conversion helpers.
 */
type ListNodeInputDescriptor = {
  /** Node rows from node-entry mode. */
  rows?: ListNodeFormRow[]
  /** Array values or raw array text from compact mode. */
  values?: readonly unknown[] | string
  /** Cycle target index; -1 means no cycle. */
  pos?: unknown
}

export const NO_CYCLE_POSITION = -1

function createListNode(
  val: unknown,
  next: ListNodeValue | null = null
): ListNodeValue {
  return { val, next }
}

const hasListNodeKeys = hasKeys('val', 'next')

export const isListNodeShape: Guard<ListNodeValue> = define<ListNodeValue>(
  (value): value is ListNodeValue => {
    const seen = new WeakSet<object>()

    const visit = (current: unknown): current is ListNodeValue => {
      if (!isObject(current)) return false
      if (seen.has(current)) return true
      seen.add(current)

      if (!hasListNodeKeys(current)) return false

      const next = (current as ListNodeValue).next
      return isNull(next) || visit(next)
    }

    return visit(value)
  }
)

const hasListInputKey = or(hasKey('rows'), hasKey('values'), hasKey('pos'))

const isListInputDescriptor: Guard<ListNodeInputDescriptor> =
  define<ListNodeInputDescriptor>(
    (value) =>
      isNonArrayObject(value) &&
      !isListNodeShape(value) &&
      hasListInputKey(value)
  )

function parseCyclePosition(value: unknown): number {
  if (isInteger(value)) return value

  if (isString(value) && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isInteger(parsed) ? parsed : NO_CYCLE_POSITION
  }

  return NO_CYCLE_POSITION
}

function applyCycle(
  head: ListNodeValue | null,
  pos: number
): ListNodeValue | null {
  if (!head || pos < 0) return head

  let current: ListNodeValue | null = head
  let tail: ListNodeValue | null = null
  let cycleTarget: ListNodeValue | null = null
  let index = 0

  while (current) {
    if (index === pos) {
      cycleTarget = current
    }

    tail = current
    current = current.next
    index += 1
  }

  if (tail && cycleTarget) {
    tail.next = cycleTarget
  }

  return head
}

export function buildListFromValues(
  values: readonly unknown[],
  pos = NO_CYCLE_POSITION
): ListNodeValue | null {
  const nodes = values.map((value) => createListNode(value))

  nodes.forEach((node, index) => {
    node.next = nodes[index + 1] ?? null
  })

  return applyCycle(nodes[0] ?? null, pos)
}

function getListValuesFromFormRows(rows: ListNodeFormRow[]): unknown[] {
  return rows
    .map((row) => row.val)
    .filter((value) => !(isString(value) && value.trim() === ''))
    .map((value) => (isString(value) ? parsePrimitiveToken(value) : value))
}

function parseListValuesInput(value: readonly unknown[] | string): unknown[] {
  if (!isString(value)) return [...value]

  const trimmed = unwrapQuotedString(value)
  if (trimmed === '' || trimmed.toLowerCase() === 'null') return []

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (isArray(parsed)) return [...parsed]
    } catch {
      // Fall back to comma-separated parsing.
    }
  }

  return splitCommaSeparatedTokens(trimmed).map(parsePrimitiveToken)
}

function getDescriptorValues(value: ListNodeInputDescriptor): unknown[] {
  if (value.rows) return getListValuesFromFormRows(value.rows)
  if (!isUndefined(value.values)) return parseListValuesInput(value.values)

  return []
}

export function parseListInput(value: unknown): ListNodeValue | null {
  if (isNil(value)) return null

  if (isListInputDescriptor(value)) {
    return buildListFromValues(
      getDescriptorValues(value),
      parseCyclePosition(value.pos)
    )
  }

  if (isListNodeShape(value)) return value

  if (isArray(value)) {
    const values = value.every((item) => hasKeys('val')(item))
      ? getListValuesFromFormRows(value as ListNodeFormRow[])
      : value

    return buildListFromValues(values)
  }

  if (isString(value)) {
    const trimmed = unwrapQuotedString(value)

    if (trimmed === '' || trimmed.toLowerCase() === 'null') {
      return null
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (isListInputDescriptor(parsed)) {
          return buildListFromValues(
            getDescriptorValues(parsed),
            parseCyclePosition(parsed.pos)
          )
        }

        return isListNodeShape(parsed) ? parsed : null
      } catch {
        return null
      }
    }

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (isArray(parsed)) {
          return buildListFromValues(parsed)
        }
      } catch {
        // Fall back to comma-separated parsing.
      }
    }

    return buildListFromValues(
      splitCommaSeparatedTokens(trimmed).map(parsePrimitiveToken)
    )
  }

  return createListNode(value)
}
