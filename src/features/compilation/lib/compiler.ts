import { DEFAULT_LANGUAGE, type SupportedLanguage } from '@/entities/code'
import type { CompilationError, CompilationResult } from '@/entities/code'

import {
  compileTypeScriptCode,
  lintTypeScriptCode,
} from '@/entities/code/compiler'

/**
 * Compiles source code through the selected language adapter.
 */
export function compileCode(
  code: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): CompilationResult {
  if (language === 'typescript') {
    return compileTypeScriptCode(code)
  }

  throw new Error(
    `Language "${String(language)}" does not support compilation yet`
  )
}

/**
 * Performs language-specific linting checks.
 */
export function lintCode(
  code: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): CompilationError[] {
  if (language === 'typescript') {
    return lintTypeScriptCode(code)
  }

  throw new Error(`Language "${String(language)}" does not support linting yet`)
}

/**
 * Compiles code and merges compilation + lint diagnostics.
 */
export function compileAndLint(
  code: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): CompilationResult {
  const compilationResult = compileCode(code, language)
  const lintErrors = lintCode(code, language)

  return {
    ...compilationResult,
    errors: [...compilationResult.errors, ...lintErrors],
  }
}
