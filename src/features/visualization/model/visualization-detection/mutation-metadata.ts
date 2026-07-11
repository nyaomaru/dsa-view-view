import type { ExecutionState } from '@/entities/execution'
import { isBooleanArray, isMatrix, isNull } from '@/shared/lib/guards'
import {
  getMatrixSignature,
  getNumericArraySignature,
  getTreeNodeSignature,
} from '../../lib/value-formatting'
import { getVisualizableVariableEntries } from './variables'
import type { SignatureReader, VisualizationMutationMetadata } from './types'

function getBooleanArraySignature(value: unknown): string | null {
  return isBooleanArray(value) ? JSON.stringify(value) : null
}

function didSignatureChange(
  nextSignature: string | null,
  previousSignature: string | null
): boolean {
  return (
    !isNull(nextSignature) &&
    !isNull(previousSignature) &&
    nextSignature !== previousSignature
  )
}

function trackSignatureMutation({
  name,
  nextValue,
  previousValue,
  readSignature,
  mutatedNames,
}: {
  name: string
  nextValue: unknown
  previousValue: unknown
  readSignature: SignatureReader
  mutatedNames: Set<string>
}): void {
  if (
    didSignatureChange(readSignature(nextValue), readSignature(previousValue))
  ) {
    mutatedNames.add(name)
  }
}

export function collectVisualizationMutationMetadata(
  executionState: ExecutionState
): VisualizationMutationMetadata {
  const metadata: VisualizationMutationMetadata = {
    mutatedNumericArrayNames: new Set<string>(),
    mutatedBooleanArrayNames: new Set<string>(),
    mutatedMatrixNames: new Set<string>(),
    mutatedTreeNodeNames: new Set<string>(),
    firstMatrixStepByName: new Map<string, number>(),
  }

  executionState.steps.forEach((step) => {
    getVisualizableVariableEntries(step.variables).forEach(([name, value]) => {
      if (isMatrix(value) && !metadata.firstMatrixStepByName.has(name)) {
        metadata.firstMatrixStepByName.set(name, step.stepNumber)
      }
    })
  })

  for (let index = 1; index < executionState.steps.length; index += 1) {
    const previousVariables = executionState.steps[index - 1]?.variables ?? {}
    const nextVariables = executionState.steps[index]?.variables ?? {}

    for (const [name, nextValue] of getVisualizableVariableEntries(
      nextVariables
    )) {
      const previousValue = previousVariables[name]

      trackSignatureMutation({
        name,
        nextValue,
        previousValue,
        readSignature: getNumericArraySignature,
        mutatedNames: metadata.mutatedNumericArrayNames,
      })
      trackSignatureMutation({
        name,
        nextValue,
        previousValue,
        readSignature: getBooleanArraySignature,
        mutatedNames: metadata.mutatedBooleanArrayNames,
      })
      trackSignatureMutation({
        name,
        nextValue,
        previousValue,
        readSignature: getMatrixSignature,
        mutatedNames: metadata.mutatedMatrixNames,
      })
      trackSignatureMutation({
        name,
        nextValue,
        previousValue,
        readSignature: getTreeNodeSignature,
        mutatedNames: metadata.mutatedTreeNodeNames,
      })
    }
  }

  return metadata
}
