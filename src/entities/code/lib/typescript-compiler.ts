import { transform } from '@babel/standalone'

import type { CompilationError, CompilationResult } from '../model/types'
import { prepareTypeScriptCodeWithClasses } from './prepared-typescript-classes'

/**
 * Compiles TypeScript/JavaScript code using Babel.
 */
export function compileTypeScriptCode(code: string): CompilationResult {
  const errors: CompilationError[] = []

  if (!code.trim()) {
    return {
      success: false,
      errors: [
        {
          line: 1,
          column: 1,
          message: 'Code cannot be empty',
          severity: 'error',
        },
      ],
    }
  }

  try {
    const prepared = prepareTypeScriptCodeWithClasses(code)
    const result = transform(prepared.code, {
      presets: ['typescript'],
      filename: 'input.ts',
    })

    if (!result.code) {
      return {
        success: false,
        errors: [
          {
            line: 1,
            column: 1,
            message: 'Compilation produced no output',
            severity: 'error',
          },
        ],
      }
    }

    return {
      success: true,
      code: result.code,
      errors: [],
    }
  } catch (error) {
    const babelError = error as Error & {
      loc?: { line: number; column: number }
    }

    errors.push({
      line: Math.max(
        1,
        (babelError.loc?.line ?? 1) -
          prepareTypeScriptCodeWithClasses(code).preludeLineCount
      ),
      column: babelError.loc?.column ?? 1,
      message: babelError.message,
      severity: 'error',
    })

    return {
      success: false,
      errors,
    }
  }
}

/**
 * Performs basic linting checks on TypeScript/JavaScript code.
 */
export function lintTypeScriptCode(code: string): CompilationError[] {
  const errors: CompilationError[] = []
  const lines = code.split('\n')

  lines.forEach((line, index) => {
    if (/\bvar\b/.test(line)) {
      errors.push({
        line: index + 1,
        column: line.indexOf('var') + 1,
        message: 'Prefer const or let over var',
        severity: 'warning',
      })
    }

    if (/console\.log/.test(line)) {
      errors.push({
        line: index + 1,
        column: line.indexOf('console.log') + 1,
        message: 'Remove console.log before production',
        severity: 'warning',
      })
    }
  })

  return errors
}
