import { parse } from '@babel/parser'
import * as t from '@babel/types'

import { isError } from '@/shared/lib/guards'
import { generate, traverse } from './instrumentation/babel-compat'
import { InstrumentationContext } from './instrumentation/context'
import { INSTRUMENTATION_INTRINSICS_KEY } from './instrumentation/intrinsics'
import { createInstrumentationVisitor } from './instrumentation/visitor'

const INTRINSICS_IDENTIFIER_BASE = '__algorithmVisualizerIntrinsics'

function createIntrinsicsIdentifier(ast: t.File): t.Identifier {
  const identifierNames = new Set<string>()
  t.traverseFast(ast, (node) => {
    if (t.isIdentifier(node)) identifierNames.add(node.name)
  })

  let candidate = INTRINSICS_IDENTIFIER_BASE
  let suffix = 2
  while (identifierNames.has(candidate)) {
    candidate = `${INTRINSICS_IDENTIFIER_BASE}${suffix++}`
  }

  return t.identifier(candidate)
}

/** Instruments JavaScript code to record execution steps. */
export function instrumentCode(code: string): string {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    })
    const intrinsicsIdentifier = createIntrinsicsIdentifier(ast)
    const context = new InstrumentationContext(intrinsicsIdentifier)
    ast.program.body.unshift(
      context.markInstrumented(
        t.variableDeclaration('const', [
          t.variableDeclarator(
            intrinsicsIdentifier,
            t.memberExpression(
              t.identifier('recordStep'),
              t.stringLiteral(INSTRUMENTATION_INTRINSICS_KEY),
              true
            )
          ),
        ])
      )
    )

    traverse(ast, createInstrumentationVisitor(context))

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
