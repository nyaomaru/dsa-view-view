import { describe, expect, it } from 'vite-plus/test'

import { executeCode } from './runner'

describe('runner - non-finite values', () => {
  it('preserves infinity values in execution snapshots with function variables', () => {
    const code = `
function initializeDistance(mat: number[][]): number[][] {
  const m = mat.length
  const n = mat[0].length
  const inside = (r: number, c: number) => r >= 0 && r < m && c >= 0 && c < n
  const distance: number[][] = Array.from({ length: m }, () =>
    Array(n).fill(Infinity)
  )

  inside(0, 0)

  return distance
}
`

    const state = executeCode(
      code,
      {
        mat: [
          [0, 0, 0],
          [0, 1, 0],
          [0, 0, 0],
        ],
      },
      'initializeDistance'
    )
    const distanceStep = state.steps.find((step) => {
      const distance = step.variables.distance
      return Array.isArray(distance)
    })

    expect(state.error).toBeUndefined()
    expect(
      (distanceStep?.variables.distance as number[][] | undefined)?.[1]?.[1]
    ).toBe(Infinity)
  })
})
