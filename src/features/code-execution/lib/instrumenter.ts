import { parse } from '@babel/parser'

import { isError } from '@/shared/lib/guards'
import { generate, traverse } from './instrumentation/babel-compat'
import { createInstrumentationVisitor } from './instrumentation/visitor'

/** Instruments JavaScript code to record execution steps. */
export function instrumentCode(code: string): string {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    })

    traverse(ast, createInstrumentationVisitor())

    return generate(ast, {
      retainLines: true,
      compact: false,
    }).code
  } catch (error) {
    const message = isError(error)
      ? error.message
      : 'Unknown instrumentation error'
    throw new Error(`Failed to instrument code: ${message}`, { cause: error })
  }
}
