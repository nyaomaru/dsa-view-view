import type { ExecutionState } from '@/entities/execution'
import { isListNodeShape } from '@/entities/data-structure'
import { getVisualizableVariableEntries } from './variables'
import type { NamedLengthCandidate } from './types'

function getListNodeLength(value: unknown): number {
  if (!isListNodeShape(value)) return 0

  const seen = new WeakSet<object>()
  let current: unknown = value
  let length = 0

  while (isListNodeShape(current)) {
    if (seen.has(current)) break

    seen.add(current)
    length += 1
    current = current.next
  }

  return length
}

export function getPrimaryListNodeName(
  variableEntries: [string, unknown][]
): string | undefined {
  const bestListNode = variableEntries.reduce<NamedLengthCandidate>(
    (best, [name, value]) => {
      const length = getListNodeLength(value)

      return length > best.length ? { name, length } : best
    },
    { length: 0 }
  )

  return bestListNode.name
}

export function getVisualizableListNodeNames(
  executionState: ExecutionState
): string[] {
  const currentStepNumber =
    executionState.steps[executionState.currentStep]?.stepNumber ?? -1
  const names = new Set<string>()

  executionState.steps.forEach((step) => {
    if (step.stepNumber > currentStepNumber) return

    getVisualizableVariableEntries(step.variables).forEach(([name, value]) => {
      if (isListNodeShape(value)) {
        names.add(name)
      }
    })
  })

  return [...names]
}
