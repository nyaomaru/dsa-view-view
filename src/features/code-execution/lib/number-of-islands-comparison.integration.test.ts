import { describe, expect, it } from 'vite-plus/test'
import { ALGORITHM_EXAMPLES } from '@/entities/algorithm-example'
import { DEFAULT_LANGUAGE } from '@/entities/code'
import { extractFunctionSignature } from '@/features/code-editing/lib/parser'
import { isArray, isMatrix } from '@/shared/lib/guards'
import { executeCode } from './runner'
import { convertInputValues } from './structured-inputs'

const DEFAULT_GRID =
  '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]'

function executeExample(exampleId: string) {
  const example = ALGORITHM_EXAMPLES.find((item) => item.id === exampleId)
  if (!example) throw new Error(`Missing example: ${exampleId}`)

  const signature = extractFunctionSignature(
    example.sourceCode,
    DEFAULT_LANGUAGE
  )
  if (!signature) throw new Error(`Missing signature: ${exampleId}`)

  return executeCode(
    example.sourceCode,
    convertInputValues(signature.parameters, { grid: DEFAULT_GRID }),
    signature.name,
    DEFAULT_LANGUAGE
  )
}

function getGridProgress(executionState: ReturnType<typeof executeExample>) {
  const progress: string[] = []

  for (const step of executionState.steps) {
    const grid = step.variables.grid
    if (!isMatrix(grid)) continue

    const snapshot = JSON.stringify(grid)
    if (progress.at(-1) !== snapshot) progress.push(snapshot)
  }

  return progress
}

describe('Number of Islands DFS comparison', () => {
  it('returns the same result and records each implementation pending work', () => {
    const recursive = executeExample('number-of-islands')
    const iterative = executeExample('number-of-islands-stack')

    expect(recursive.error).toBeUndefined()
    expect(iterative.error).toBeUndefined()
    expect(recursive.returnValue).toBe(3)
    expect(iterative.returnValue).toBe(recursive.returnValue)
    expect(getGridProgress(iterative)).toEqual(getGridProgress(recursive))
    expect(
      recursive.steps.some(
        (step) => step.metadata?.callFrame?.functionName === 'visit'
      )
    ).toBe(true)
    expect(iterative.steps.some((step) => isArray(step.variables.stack))).toBe(
      true
    )
  })
})
