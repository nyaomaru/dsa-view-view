export const MAX_STEPS = 3_000

export function getStepLimitMessage(limit: number): string {
  return `Execution truncated at ${limit.toLocaleString()} steps. The algorithm may have too many steps to visualize.`
}

export class StepLimitError extends Error {
  constructor(limit: number) {
    super(getStepLimitMessage(limit))
    this.name = 'StepLimitError'
  }
}
