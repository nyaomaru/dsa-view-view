export const INSTRUMENTATION_INTRINSICS_KEY =
  '__algorithmVisualizerIntrinsics'

const instrumentationIntrinsics = Object.freeze({
  apply: Reflect.apply,
  iterator: Symbol.iterator,
  TypeError,
})

export type InstrumentationIntrinsicName =
  keyof typeof instrumentationIntrinsics

/** Makes captured host intrinsics available to generated instrumentation. */
export function attachInstrumentationIntrinsics(target: object): void {
  Object.defineProperty(target, INSTRUMENTATION_INTRINSICS_KEY, {
    value: instrumentationIntrinsics,
  })
}
