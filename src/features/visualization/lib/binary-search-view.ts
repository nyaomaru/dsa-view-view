import type { ExecutionStep } from '@/entities/execution'
import { isInteger, isNull, isNumericArray } from '@/shared/lib/guards'

const BINARY_SEARCH_INDEX_NAMES = ['left', 'right', 'mid'] as const

/** Valid binary-search pointer indexes captured from an execution step. */
export type BinarySearchIndexState = {
  /** Inclusive left boundary. */
  left: number
  /** Inclusive right boundary. */
  right: number
  /** Optional current midpoint. */
  mid?: number
}

/**
 * Reads binary-search indexes from execution variables.
 *
 * @param variables Variables captured for one execution step.
 * @returns Integer index state, or `null` when required indexes are absent.
 */
export function getBinarySearchIndexState(
  variables: ExecutionStep['variables']
): BinarySearchIndexState | null {
  const left = variables.left
  const right = variables.right
  const mid = variables.mid

  if (!isInteger(left) || !isInteger(right)) {
    return null
  }

  return {
    left,
    right,
    mid: isInteger(mid) ? mid : undefined,
  }
}

/**
 * Checks whether execution variables contain a valid binary-search state.
 *
 * @param variables Variables captured for one execution step.
 * @returns Whether valid left and right indexes can be read.
 */
export function hasBinarySearchIndexState(
  variables: ExecutionStep['variables']
): boolean {
  return !isNull(getBinarySearchIndexState(variables))
}

/**
 * Checks whether a value should use the binary-search visualization.
 *
 * @param name Variable name associated with the candidate array.
 * @param value Candidate runtime value.
 * @param variables Variables captured for the same execution step.
 * @returns Whether the value and execution state match binary-search behavior.
 */
export function isBinarySearchArrayCandidate(
  name: string,
  value: unknown,
  variables: ExecutionStep['variables']
): boolean {
  return (
    name !== 'result' &&
    isNumericArray(value) &&
    value.length > 0 &&
    hasBinarySearchIndexVariables(variables) &&
    hasBinarySearchIndexState(variables)
  )
}

/**
 * Checks whether binary-search index names are present in execution variables.
 *
 * @param variables Variables captured for one execution step.
 * @returns Whether left, right, and mid keys are present.
 */
export function hasBinarySearchIndexVariables(
  variables: ExecutionStep['variables']
): boolean {
  return BINARY_SEARCH_INDEX_NAMES.every((name) => name in variables)
}
