import { describe, expect, it, vi } from 'vite-plus/test'
import type { Monaco } from '@monaco-editor/react'

import { registerFormattingProvider } from './register-formatting-provider'

const createMonacoFormattingMock = () => {
  const typeScriptDisposable = { dispose: vi.fn() }
  const javaScriptDisposable = { dispose: vi.fn() }
  const registerDocumentFormattingEditProvider = vi
    .fn()
    .mockReturnValueOnce(typeScriptDisposable)
    .mockReturnValueOnce(javaScriptDisposable)

  const monaco = {
    languages: {
      registerDocumentFormattingEditProvider,
    },
  } as unknown as Monaco

  return {
    monaco,
    registerDocumentFormattingEditProvider,
    typeScriptDisposable,
    javaScriptDisposable,
  }
}

describe('registerFormattingProvider', () => {
  it('registers one formatting provider for TypeScript and JavaScript', () => {
    const { monaco, registerDocumentFormattingEditProvider } =
      createMonacoFormattingMock()

    registerFormattingProvider(monaco)

    expect(registerDocumentFormattingEditProvider).toHaveBeenCalledTimes(2)
    expect(registerDocumentFormattingEditProvider.mock.calls[0][0]).toBe(
      'typescript'
    )
    expect(registerDocumentFormattingEditProvider.mock.calls[1][0]).toBe(
      'javascript'
    )
    expect(registerDocumentFormattingEditProvider.mock.calls[0][1]).toBe(
      registerDocumentFormattingEditProvider.mock.calls[1][1]
    )
  })

  it('disposes every registered formatting provider', () => {
    const { monaco, typeScriptDisposable, javaScriptDisposable } =
      createMonacoFormattingMock()

    const dispose = registerFormattingProvider(monaco)

    dispose()

    expect(typeScriptDisposable.dispose).toHaveBeenCalledTimes(1)
    expect(javaScriptDisposable.dispose).toHaveBeenCalledTimes(1)
  })
})
