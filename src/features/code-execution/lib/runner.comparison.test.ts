import { describe, expect, it } from 'vite-plus/test'

import { executeCode } from './runner'

describe('runner - runtime comparisons', () => {
  it('evaluates operands once and preserves logical short-circuiting', () => {
    const state = executeCode(
      `
function compare(): { calls: number; first: boolean; second: boolean } {
  let calls = 0
  const next = () => calls++
  const first = next() < next()
  const second = true || next() > 0

  return { calls, first, second }
}
`,
      {},
      'compare'
    )
    const comparisons = state.steps.filter((step) => step.metadata?.comparison)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual({ calls: 2, first: true, second: true })
    expect(comparisons).toHaveLength(1)
    expect(comparisons[0]?.metadata).toMatchObject({
      conditionResult: true,
      comparison: {
        left: { expression: 'next()', value: 0 },
        operator: '<',
        right: { expression: 'next()', value: 1 },
        result: true,
      },
    })
  })

  it('records comparisons containing template literals', () => {
    const state = executeCode(
      `
function compare(status: string): boolean {
  return \`ready\` === status
}
`,
      { status: 'ready' },
      'compare'
    )
    const comparison = state.steps.find((step) => step.metadata?.comparison)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(true)
    expect(comparison).toMatchObject({
      description: 'Compare `ready` === status -> true',
      metadata: {
        comparison: {
          left: { expression: '`ready`', value: 'ready' },
          operator: '===',
          right: { expression: 'status', value: 'ready' },
          result: true,
        },
      },
    })
  })

  it('does not invoke getters while capturing comparison operands', () => {
    const state = executeCode(
      `
function compare(): { calls: number; matched: boolean } {
  let calls = 0
  const matched = ({
    get x() {
      calls += 1
      return 1
    },
  }) === null

  return { calls, matched }
}
`,
      {},
      'compare'
    )
    const comparison = state.steps.find((step) => step.metadata?.comparison)

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual({ calls: 0, matched: false })
    expect(comparison?.metadata?.comparison?.left.value).toBe('[Object]')
  })

  it('preserves the variable environment of direct eval operands', () => {
    const state = executeCode(
      `
function compare(): number {
  eval('var observed = 1; 0') === 0

  return observed
}
`,
      {},
      'compare'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(1)
    expect(state.steps.some((step) => step.metadata?.comparison)).toBe(false)
  })

  it('preserves the caller of comparison operand calls', () => {
    const state = executeCode(
      `
function inspect(): string | undefined {
  return inspect.caller?.name
}

function compare(): boolean {
  return inspect() === 'compare'
}
`,
      {},
      'compare'
    )
    const comparison = state.steps.find(
      (step) => step.metadata?.comparison?.left.expression === 'inspect()'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(true)
    expect(comparison?.metadata?.comparison?.result).toBe(true)
    expect(
      state.steps.some((step) =>
        Object.keys(step.variables).some((name) =>
          name.includes('algorithmVisualizerComparison')
        )
      )
    ).toBe(false)
  })

  it('does not expose comparison temporaries in loop snapshots', () => {
    const state = executeCode(
      `
function coinChange(coins: number[], amount: number): number {
  const dp = Array(amount + 1).fill(amount + 1)
  dp[0] = 0

  for (const coin of coins) {
    for (let x = coin; x <= amount; x++) {
      dp[x] = Math.min(dp[x], dp[x - coin] + 1)
    }
  }

  return dp[amount] > amount ? -1 : dp[amount]
}
`,
      { coins: [1, 2, 5], amount: 11 },
      'coinChange'
    )
    const internalNames = new Set(
      state.steps.flatMap((step) =>
        Object.keys(step.variables).filter((name) =>
          name.includes('algorithmVisualizerComparison')
        )
      )
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(3)
    expect([...internalNames]).toEqual([])
  })

  it('does not read a for-loop binding from its own initializer', () => {
    const state = executeCode(
      `
function collect(n: number): number[] {
  const values: number[] = []

  for (let i = n > 0 ? 0 : 1; i < 1; i += 1) {
    values.push(i)
  }

  return values
}
`,
      { n: 1 },
      'collect'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toEqual([0])
    expect(
      state.steps.some(
        (step) => step.metadata?.comparison?.left.expression === 'n'
      )
    ).toBe(false)
  })

  it('does not read parameters or frame bindings from a default parameter', () => {
    const state = executeCode(
      `
function choose(n = 1, start = n > 0 ? 0 : 1): number {
  return start
}
`,
      { n: undefined, start: undefined },
      'choose'
    )

    expect(state.error).toBeUndefined()
    expect(state.returnValue).toBe(0)
    expect(
      state.steps.some(
        (step) => step.metadata?.comparison?.left.expression === 'n'
      )
    ).toBe(false)
  })

  it.each([
    {
      method: 'object',
      code: `
function choose(flag: boolean): string {
  const methods = {
    [flag === true ? 'a' : 'b'](value: string): string {
      return value
    },
  }

  return methods.a('object')
}
`,
      expected: 'object',
    },
    {
      method: 'class',
      code: `
function choose(flag: boolean): string {
  class Methods {
    [flag === true ? 'a' : 'b'](value: string): string {
      return value
    }
  }

  return new Methods().a('class')
}
`,
      expected: 'class',
    },
  ])(
    'does not read $method method bindings from its computed key',
    ({ code, expected }) => {
      const state = executeCode(code, { flag: true }, 'choose')

      expect(state.error).toBeUndefined()
      expect(state.returnValue).toBe(expected)
      expect(
        state.steps.some(
          (step) => step.metadata?.comparison?.left.expression === 'flag'
        )
      ).toBe(false)
    }
  )

  it.each([
    {
      loop: 'for...of',
      code: `
function collect(s: string): string[] {
  const values: string[] = []

  for (const char of s.length > 0 ? s : '') {
    values.push(char)
  }

  return values
}
`,
      inputs: { s: 'ab' },
      expected: ['a', 'b'],
      leftExpression: 's.length',
    },
    {
      loop: 'for...in',
      code: `
function collect(items: Record<string, number>): string[] {
  const keys: string[] = []

  for (const key in Object.keys(items).length > 0 ? items : {}) {
    keys.push(key)
  }

  return keys
}
`,
      inputs: { items: { first: 1 } },
      expected: ['first'],
      leftExpression: 'Object.keys(items).length',
    },
  ])(
    'does not read a $loop binding while evaluating its right-hand expression',
    ({ code, inputs, expected, leftExpression }) => {
      const state = executeCode(code, inputs, 'collect')

      expect(state.error).toBeUndefined()
      expect(state.returnValue).toEqual(expected)
      expect(
        state.steps.some(
          (step) =>
            step.metadata?.comparison?.left.expression === leftExpression
        )
      ).toBe(false)
    }
  )
})
