import { parse } from '@babel/parser'

import { define, isFunction, isNonArrayObject } from '@/shared/lib/guards'

type SyncGeneratorIterator = Iterator<unknown, unknown, unknown> &
  Iterable<unknown>

/** Matches synchronous generator-like iterators without consuming them. */
export const isSyncGeneratorIterator = define<SyncGeneratorIterator>(
  (value) => {
    if (!isNonArrayObject(value) || !isFunction(value.next)) return false

    return isFunction(Reflect.get(value, Symbol.iterator))
  }
)

/** Identifies a synchronous generator selected as the execution entry. */
export function isSyncGeneratorEntry(
  code: string,
  entryFunctionName: string
): boolean {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    })

    return ast.program.body.some((node) => {
      if (node.type === 'FunctionDeclaration') {
        return (
          node.id?.name === entryFunctionName && node.generator && !node.async
        )
      }

      if (node.type !== 'VariableDeclaration') return false

      return node.declarations.some((declaration) => {
        if (
          declaration.id.type !== 'Identifier' ||
          declaration.id.name !== entryFunctionName ||
          declaration.init?.type !== 'FunctionExpression'
        ) {
          return false
        }

        return declaration.init.generator && !declaration.init.async
      })
    })
  } catch {
    return false
  }
}

/** Advances a synchronous generator returned by an entry function to completion. */
export function consumeGenerator(iterator: SyncGeneratorIterator): unknown {
  let iteration = iterator.next()

  while (!iteration.done) {
    iteration = iterator.next()
  }

  return iteration.value
}
