import { isNull, isNumber, isNumericArray } from '@/shared/lib/guards'

/** Display values for an O(1)-space rolling DP state. */
export type RollingDpState = {
  /** Labels describing each rolling value. */
  labels: string[]
  /** Current rolling values. */
  values: number[]
}

/** Reads the conventional prev2/prev1/current rolling-DP variables. */
export function getRollingDpState(
  variables: Record<string, unknown>
): RollingDpState | null {
  const prev2 = variables.prev2
  const prev1 = variables.prev1
  const current = variables.current

  if (!isNumber(prev2) || !isNumber(prev1)) return null

  return isNumber(current)
    ? { labels: ['prev2', 'prev1', 'current'], values: [prev2, prev1, current] }
    : { labels: ['prev2', 'prev1'], values: [prev2, prev1] }
}

/** Checks for a numeric source array accompanied by rolling-DP state. */
export function isRollingDpCandidate(
  variableName: string,
  value: unknown,
  variables: Record<string, unknown>
): boolean {
  return (
    variableName.toLowerCase() === 'nums' &&
    isNumericArray(value) &&
    value.length > 1 &&
    !isNull(getRollingDpState(variables))
  )
}
