import {
  define,
  hasKeys,
  isArray,
  isObject,
  type Guard,
} from '@/shared/lib/guards'

/** Runtime graph-node shape prepared for user algorithms. */
export type GraphNodeValue = {
  /** Node display value. */
  val: unknown
  /** Adjacent graph nodes. */
  neighbors: GraphNodeValue[]
}

const hasGraphNodeKeys = hasKeys('val', 'neighbors')

/** Identifies a graph-node structure while safely following cyclic edges. */
export const isGraphNodeShape: Guard<GraphNodeValue> = define<GraphNodeValue>(
  (value): value is GraphNodeValue => {
    const seen = new WeakSet<object>()

    const visit = (current: unknown): current is GraphNodeValue => {
      if (!isObject(current) || !hasGraphNodeKeys(current)) return false
      if (seen.has(current)) return true
      if (!isArray(current.neighbors)) return false

      seen.add(current)
      return current.neighbors.every(visit)
    }

    return visit(value)
  }
)
