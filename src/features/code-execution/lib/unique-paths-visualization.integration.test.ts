import { describe, expect, it } from 'vite-plus/test'
import { ALGORITHM_EXAMPLE_SOURCES } from '@/entities/algorithm-example/model/algorithm-example-sources'
import { getUniquePathsVisualizationState } from '@/features/visualization/lib/unique-paths-view'
import { detectVisualizationState } from '@/features/visualization/model/use-visualization-detection'
import { getPrimaryVisualization } from '@/features/visualization/model/primary-visualization'
import { executeCode } from './runner'

const source = ALGORITHM_EXAMPLE_SOURCES['unique-paths']

describe('Unique Paths visualization integration', () => {
  it('selects the DP grid and follows actual writes through completion and rewind', () => {
    const state = executeCode(source, { m: 3, n: 7 }, 'uniquePaths')
    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(28)
    expect(
      getPrimaryVisualization(detectVisualizationState(state))
    ).toMatchObject({
      type: 'matrix',
      targetVariable: 'dp',
    })
    const views = state.steps.map((_, index) =>
      getUniquePathsVisualizationState(state, index, 'dp')
    )
    const initialized = views.find((view) => view && !view.active)
    expect(initialized?.data).toEqual(
      Array.from({ length: 3 }, () => Array(7).fill(0))
    )
    const updateIndex = views.findIndex(
      (view) => view?.active?.row === 1 && view.active.col === 1
    )
    expect(updateIndex).toBeGreaterThan(0)
    expect(views[updateIndex]?.data[1][1]).toBe(2)
    expect(views[updateIndex]?.complete).toBe(false)
    expect(views.at(-1)).toMatchObject({ complete: true })
    expect(views.at(-1)?.data).toEqual([
      [1, 1, 1, 1, 1, 1, 1],
      [1, 2, 3, 4, 5, 6, 7],
      [1, 3, 6, 10, 15, 21, 28],
    ])
    expect(getUniquePathsVisualizationState(state, updateIndex, 'dp')).toEqual(
      views[updateIndex]
    )
  })

  it.each([
    { m: 1, n: 1 },
    { m: 1, n: 5 },
    { m: 5, n: 1 },
  ])('handles single-axis grids: $m × $n', (input) => {
    const state = executeCode(source, input, 'uniquePaths')
    expect(state.returnValue).toBe(1)
    expect(
      getUniquePathsVisualizationState(state, state.steps.length - 1, 'dp')
    ).toMatchObject({
      complete: true,
      data: Array.from({ length: input.m }, () => Array(input.n).fill(1)),
    })
  })

  it('keeps unrelated DP matrices in the generic matrix view', () => {
    const state = executeCode(
      'function table(m: number, n: number) { const dp = [[0, 1], [1, 2]]; return dp }',
      { m: 2, n: 2 },
      'table'
    )
    expect(
      getUniquePathsVisualizationState(state, state.steps.length - 1, 'dp')
    ).toBeNull()
  })

  it('keeps edited Unique Paths implementations in the generic matrix view', () => {
    const state = executeCode(
      `function uniquePaths(m: number, n: number): number {
        const dp = Array.from({ length: m }, () => Array(n).fill(0))
        dp[0][0] = 1
        for (let i = 1; i < m; i++) dp[i][0] = 1
        for (let j = 1; j < n; j++) dp[0][j] = 1
        dp[1][1] = 0
        return dp[m - 1][n - 1]
      }`,
      { m: 2, n: 2 },
      'uniquePaths'
    )

    expect(
      getUniquePathsVisualizationState(state, state.steps.length - 1, 'dp')
    ).toBeNull()
  })
})
