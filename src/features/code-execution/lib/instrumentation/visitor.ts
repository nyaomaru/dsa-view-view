import { InstrumentationContext } from './context'
import { createAwaitVisitor } from './await-visitor'
import { createFunctionVisitors } from './function-visitors'
import { createLoopVisitors } from './loop-visitors'
import { createMutationVisitors } from './mutation-visitors'
import { createReturnVisitor } from './return-visitor'

export const createInstrumentationVisitor = () => {
  const context = new InstrumentationContext()
  return {
    ...createFunctionVisitors(context),
    ...createAwaitVisitor(context),
    ...createMutationVisitors(context),
    ...createLoopVisitors(context),
    ...createReturnVisitor(context),
  }
}
