import { describe, expect, it } from 'vite-plus/test'

import { DEFAULT_LANGUAGE } from '@/entities/code'
import { extractFunctionSignature } from '@/features/code-editing/lib/parser'
import { compileAndLint } from '@/features/compilation/lib/compiler'
import { convertInputValues } from '@/features/code-execution'
import { executeCode } from '@/features/code-execution/lib/runner'

import {
  ALGORITHM_EXAMPLES,
  getRandomExample,
} from '@/entities/algorithm-example'

describe('algorithm examples', () => {
  it('keeps example ids unique', () => {
    const ids = ALGORITHM_EXAMPLES.map((example) => example.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('compiles every bundled example and exposes a runnable signature', () => {
    for (const example of ALGORITHM_EXAMPLES) {
      const result = compileAndLint(example.sourceCode, DEFAULT_LANGUAGE)
      const signature = extractFunctionSignature(
        example.sourceCode,
        DEFAULT_LANGUAGE
      )

      expect(result.errors, example.label).toEqual([])
      expect(result.success, example.label).toBe(true)
      expect(signature?.name, example.label).toBeTruthy()
    }
  })

  it('includes graph examples in the bundled v1 examples', () => {
    const ids = ALGORITHM_EXAMPLES.map((example) => example.id)

    expect(ids).toContain('course-schedule')
    expect(ids).toContain('clone-graph')
  })

  it('provides runnable default inputs for every bundled example', () => {
    for (const example of ALGORITHM_EXAMPLES) {
      const signature = extractFunctionSignature(
        example.sourceCode,
        DEFAULT_LANGUAGE
      )

      expect(signature, example.label).toBeTruthy()
      expect(example.defaultInputValues, example.label).toBeTruthy()

      const inputs = convertInputValues(
        signature?.parameters ?? [],
        example.defaultInputValues ?? {}
      )
      const state = executeCode(
        example.sourceCode,
        inputs,
        signature?.name,
        DEFAULT_LANGUAGE
      )

      expect(state.error, example.label).toBeUndefined()
      expect(state.steps.length, example.label).toBeGreaterThan(0)
    }
  })

  it('selects an example from the full list using the provided random source', () => {
    expect(getRandomExample(() => 0)).toBe(ALGORITHM_EXAMPLES[0])
    expect(getRandomExample(() => 0.999999)).toBe(
      ALGORITHM_EXAMPLES[ALGORITHM_EXAMPLES.length - 1]
    )
    expect(getRandomExample(() => 1)).toBe(
      ALGORITHM_EXAMPLES[ALGORITHM_EXAMPLES.length - 1]
    )
  })
})
