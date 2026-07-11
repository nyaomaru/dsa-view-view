import * as babelGenerator from '@babel/generator'
import * as babelTraverse from '@babel/traverse'
import { isFunction } from '@/shared/lib/guards'

/**
 * Runtime type of Babel generator's default export.
 */
type GenerateFn = typeof import('@babel/generator').default
/**
 * Runtime type of Babel traverse's default export.
 */
type TraverseFn = typeof import('@babel/traverse').default

const resolveGenerate = (
  module: typeof import('@babel/generator')
): GenerateFn => {
  if (isFunction(module.default)) {
    return module.default
  }

  const nestedDefault = (module.default as { default?: unknown } | undefined)
    ?.default
  if (isFunction(nestedDefault)) {
    return nestedDefault as GenerateFn
  }

  const namedGenerate = (module.default as { generate?: unknown } | undefined)
    ?.generate
  if (isFunction(namedGenerate)) {
    return namedGenerate as GenerateFn
  }

  if (isFunction(module.generate)) {
    return module.generate as GenerateFn
  }

  throw new Error('Failed to resolve @babel/generator export')
}

const resolveTraverse = (
  module: typeof import('@babel/traverse')
): TraverseFn => {
  if (isFunction(module.default)) {
    return module.default
  }

  const nestedDefault = (module.default as { default?: unknown } | undefined)
    ?.default
  if (isFunction(nestedDefault)) {
    return nestedDefault as TraverseFn
  }

  throw new Error('Failed to resolve @babel/traverse export')
}

export const generate = resolveGenerate(babelGenerator)
export const traverse = resolveTraverse(babelTraverse)
