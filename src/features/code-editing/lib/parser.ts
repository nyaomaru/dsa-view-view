import { DEFAULT_LANGUAGE, type SupportedLanguage } from '@/entities/code'
import type { FunctionSignature } from '@/entities/code'

import { extractTypeScriptFunctionSignature } from './typescript-parser'

/**
 * Extracts a function signature through the selected language adapter.
 */
export function extractFunctionSignature(
  code: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): FunctionSignature | null {
  if (language === 'typescript') {
    return extractTypeScriptFunctionSignature(code)
  }

  throw new Error(
    `Language "${String(language)}" does not support signature extraction yet`
  )
}
