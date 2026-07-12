import { useCallback, useEffect, useState } from 'react'
import {
  convertInputValues,
  useAlgorithmExecution,
  validateInputs,
} from '@/features/code-execution'
import { DEFAULT_LANGUAGE } from '@/entities/code'
import type { ShareStateV1 } from '@/entities/share-state'
import type { AppMode } from '@/shared/model'
import type {
  CompilationError,
  CompilationResult,
  FunctionSignature,
} from '@/entities/code'
import type { ExecutionState, InputValues } from '@/entities/execution'
import {
  ALGORITHM_EXAMPLES,
  getRandomExample,
  type AlgorithmExample,
} from '@/entities/algorithm-example'
import {
  createShareUrl,
  readExampleFromUrl,
  readShareStateFromUrl,
} from '@/features/shareable-url'
import type { ShareStateDecodeErrorReason } from '@/entities/share-state'
import {
  isArray,
  isNull,
  isNumber,
  isObject,
  isUndefined,
} from '@/shared/lib/guards'

function getRuntimeHighlightedLine(
  mode: AppMode,
  executionState: ExecutionState | null
): number | undefined {
  if (mode !== 'runtime' || isNull(executionState)) {
    return undefined
  }

  const line = executionState.steps[executionState.currentStep]?.line
  return isNumber(line) && line > 0 ? line : undefined
}

function getInitialExample() {
  if (typeof window !== 'undefined') {
    return (
      readExampleFromUrl(window.location, ALGORITHM_EXAMPLES) ??
      getRandomExample()
    )
  }

  return getRandomExample()
}

function getShareMode(
  mode: AppMode,
  compilationResult: CompilationResult | null,
  executionState: ExecutionState | null
): ShareStateV1['m'] {
  if (executionState) return 'runtime'
  if (compilationResult?.success && mode === 'verification')
    return 'verification'
  return 'editor'
}

function stableJson(value: unknown): string {
  if (isNull(value) || !isObject(value)) return JSON.stringify(value)
  if (isArray(value)) return `[${value.map(stableJson).join(',')}]`

  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, entryValue]) => `${JSON.stringify(key)}:${stableJson(entryValue)}`
    )
    .join(',')}}`
}

function getShareRestoreErrorMessage(
  reason: ShareStateDecodeErrorReason
): string {
  switch (reason) {
    case 'too-large':
      return 'This shared link is too large to load. Ask for a shorter link or share a built-in example instead.'
    case 'unsupported-version':
      return 'This shared link was created by an unsupported version of DSA View View. Ask for a new link.'
    case 'invalid-encoding':
    case 'invalid-json':
    case 'invalid-state':
      return 'This shared link is broken or incomplete. Ask for a new link.'
  }
}

/** Custom runtime restored from a share URL and awaiting user approval. */
type PendingSharedRuntime = {
  /** Restored custom source code. */
  sourceCode: string
  /** Validated and converted function inputs. */
  inputs: InputValues
  /** Entry function parsed from the shared source. */
  entryFunctionName: string
  /** Optional execution step requested by the share URL. */
  step?: number
}

export function useAppState() {
  const activeLanguage = DEFAULT_LANGUAGE
  const [initialExample] = useState(getInitialExample)
  const [mode, setMode] = useState<AppMode>('editor')
  const [selectedExampleId, setSelectedExampleId] = useState(initialExample.id)
  const [sourceCode, setSourceCode] = useState(initialExample.sourceCode)
  const [verificationInputValues, setVerificationInputValues] = useState<
    Record<string, unknown>
  >(initialExample.defaultInputValues ?? {})
  const [verificationDefaultInputValues, setVerificationDefaultInputValues] =
    useState<Record<string, unknown>>(initialExample.defaultInputValues ?? {})
  const [compilationResult, setCompilationResult] =
    useState<CompilationResult | null>(null)
  const [lintErrors, setLintErrors] = useState<CompilationError[]>([])
  const [functionSignature, setFunctionSignature] =
    useState<FunctionSignature | null>(null)
  const [shareRestoreError, setShareRestoreError] = useState<string | null>(
    null
  )
  const [pendingSharedRuntime, setPendingSharedRuntime] =
    useState<PendingSharedRuntime | null>(null)

  const execution = useAlgorithmExecution()
  const {
    executionState,
    startExecution,
    startExecutionAndPlayback,
    clearExecution,
    setExecutionState,
  } = execution
  const selectedExample = ALGORITHM_EXAMPLES.find(
    (example) => example.id === selectedExampleId
  )

  const resetDerivedState = useCallback(() => {
    setCompilationResult(null)
    setFunctionSignature(null)
    setLintErrors([])
    clearExecution()
  }, [clearExecution])

  const applyExample = useCallback((example: AlgorithmExample) => {
    const defaultInputValues = example.defaultInputValues ?? {}

    setSelectedExampleId(example.id)
    setSourceCode(example.sourceCode)
    setVerificationInputValues(defaultInputValues)
    setVerificationDefaultInputValues(defaultInputValues)
  }, [])

  const compileSourceCode = useCallback(
    async (nextSourceCode: string) => {
      const [{ compileAndLint }, { extractFunctionSignature }] =
        await Promise.all([
          import('@/features/compilation/compiler'),
          import('@/features/code-editing/parser'),
        ])
      const result = compileAndLint(nextSourceCode, activeLanguage)
      setCompilationResult(result)
      clearExecution()

      if (result.success && result.code) {
        const signature = extractFunctionSignature(
          nextSourceCode,
          activeLanguage
        )
        setFunctionSignature(signature)
        setMode('verification')
        return { result, signature }
      } else {
        setFunctionSignature(null)
        return { result, signature: null }
      }
    },
    [activeLanguage, clearExecution]
  )

  const handleCompile = useCallback(async () => {
    await compileSourceCode(sourceCode)
  }, [compileSourceCode, sourceCode])

  const handleRunCode = useCallback(
    async (values: InputValues) => {
      if (!compilationResult?.code) return
      const executionResult = await startExecution(
        sourceCode,
        values,
        functionSignature?.name,
        activeLanguage
      )
      if (!executionResult) return
      setMode('runtime')
    },
    [
      activeLanguage,
      compilationResult?.code,
      functionSignature?.name,
      sourceCode,
      startExecution,
    ]
  )

  const handleEditorChange = useCallback(
    (value: string) => {
      setSourceCode(value)
      setSelectedExampleId('custom')
      setVerificationInputValues({})
      setVerificationDefaultInputValues({})
      resetDerivedState()
      setMode((currentMode) =>
        currentMode === 'runtime' ? 'editor' : currentMode
      )
    },
    [resetDerivedState]
  )

  const handleExampleChange = useCallback(
    async (exampleId: string) => {
      const example = ALGORITHM_EXAMPLES.find((item) => item.id === exampleId)
      if (!example) return

      applyExample(example)
      await compileSourceCode(example.sourceCode)
    },
    [applyExample, compileSourceCode]
  )

  const handleRunDemo = useCallback(async () => {
    const demoExample = getRandomExample()
    if (!demoExample) return

    applyExample(demoExample)

    const { result, signature } = await compileSourceCode(
      demoExample.sourceCode
    )
    if (!result.success || !signature) return

    const inputs = convertInputValues(
      signature.parameters,
      demoExample.defaultInputValues ?? {}
    )
    const executionResult = await startExecutionAndPlayback(
      demoExample.sourceCode,
      inputs,
      signature.name,
      activeLanguage
    )
    if (!executionResult) return
    setMode('runtime')
  }, [
    activeLanguage,
    applyExample,
    compileSourceCode,
    startExecutionAndPlayback,
  ])

  const createCurrentShareUrl = useCallback(async () => {
    if (typeof window === 'undefined') {
      throw new Error('Share URL is only available in the browser')
    }

    const selectedSourceExample = ALGORITHM_EXAMPLES.find(
      (example) => example.sourceCode === sourceCode
    )
    const currentStep =
      executionState && executionState.currentStep > 0
        ? executionState.currentStep
        : undefined
    const shouldIncludeInputs =
      Object.keys(verificationInputValues).length > 0 &&
      (!isNull(executionState) ||
        stableJson(verificationInputValues) !==
          stableJson(selectedSourceExample?.defaultInputValues ?? {}))
    const shareState: ShareStateV1 = {
      v: 1,
      l: activeLanguage,
      e: selectedSourceExample?.id,
      c: selectedSourceExample ? undefined : sourceCode,
      i: shouldIncludeInputs ? verificationInputValues : undefined,
      m: getShareMode(mode, compilationResult, executionState),
      p: currentStep,
    }
    const result = await createShareUrl(
      shareState,
      window.location,
      ALGORITHM_EXAMPLES,
      { format: 'token' }
    )

    if (!result.success) {
      throw new Error('This visualization is too large to store in a URL.')
    }

    return result.url
  }, [
    activeLanguage,
    compilationResult,
    executionState,
    mode,
    sourceCode,
    verificationInputValues,
  ])

  const handleCancelSharedRuntime = useCallback(() => {
    setPendingSharedRuntime(null)
    setMode('verification')
  }, [])

  const handleConfirmSharedRuntime = useCallback(async () => {
    if (!pendingSharedRuntime) return

    setPendingSharedRuntime(null)
    const executionResult = await startExecution(
      pendingSharedRuntime.sourceCode,
      pendingSharedRuntime.inputs,
      pendingSharedRuntime.entryFunctionName,
      activeLanguage
    )
    if (!executionResult) return
    setShareRestoreError(null)
    setMode('runtime')

    if (!isUndefined(pendingSharedRuntime.step)) {
      setExecutionState({
        ...executionResult,
        currentStep: Math.min(
          pendingSharedRuntime.step,
          executionResult.totalSteps - 1
        ),
      })
    }
  }, [activeLanguage, pendingSharedRuntime, setExecutionState, startExecution])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false

    async function restoreShareState() {
      const decoded = await readShareStateFromUrl(window.location)
      if (cancelled || isNull(decoded)) return

      if (!decoded.success) {
        setShareRestoreError(getShareRestoreErrorMessage(decoded.reason))
        return
      }

      const state = decoded.state
      const example = state.e
        ? ALGORITHM_EXAMPLES.find((item) => item.id === state.e)
        : undefined
      const restoredSource = state.c ?? example?.sourceCode

      if (!restoredSource) {
        setShareRestoreError(
          'This shared link references an example that could not be found.'
        )
        return
      }

      const restoredInputs = state.i ?? example?.defaultInputValues ?? {}
      setShareRestoreError(null)
      setSourceCode(restoredSource)
      setSelectedExampleId(state.c ? 'custom' : (example?.id ?? 'custom'))
      setVerificationInputValues(restoredInputs)
      setVerificationDefaultInputValues(restoredInputs)

      if (state.m === 'verification' || state.m === 'runtime') {
        const { result, signature } = await compileSourceCode(restoredSource)
        if (!result.success || !signature || cancelled) return

        const shouldAutoRun = state.m === 'runtime' && !isUndefined(state.i)

        if (shouldAutoRun) {
          const validation = validateInputs(
            signature.parameters,
            restoredInputs
          )
          if (!validation.success) {
            setShareRestoreError('Shared runtime inputs could not be loaded.')
            return
          }

          const convertedInputs = convertInputValues(
            signature.parameters,
            restoredInputs
          )

          if (!isUndefined(state.c)) {
            setPendingSharedRuntime({
              sourceCode: restoredSource,
              inputs: convertedInputs,
              entryFunctionName: signature.name,
              step: state.p,
            })
            return
          }

          const executionResult = await startExecution(
            restoredSource,
            convertedInputs,
            signature.name,
            activeLanguage
          )

          if (cancelled || !executionResult) return
          setShareRestoreError(null)
          setMode('runtime')

          if (!isUndefined(state.p)) {
            setExecutionState({
              ...executionResult,
              currentStep: Math.min(state.p, executionResult.totalSteps - 1),
            })
          }
        }
      }
    }

    void restoreShareState()

    return () => {
      cancelled = true
    }
  }, [activeLanguage, compileSourceCode, setExecutionState, startExecution])

  const highlightedLine = getRuntimeHighlightedLine(mode, executionState)

  return {
    activeLanguage,
    mode,
    setMode,
    sourceCode,
    algorithmExamples: ALGORITHM_EXAMPLES,
    selectedExampleId,
    selectedExampleDefaultInputValues:
      Object.keys(verificationDefaultInputValues).length > 0
        ? verificationDefaultInputValues
        : selectedExample?.defaultInputValues,
    verificationInputValues,
    setVerificationInputValues,
    shareRestoreError,
    pendingSharedRuntime,
    handleCancelSharedRuntime,
    handleConfirmSharedRuntime,
    compilationResult,
    lintErrors,
    setLintErrors,
    functionSignature,
    highlightedLine,
    handleCompile,
    handleRunCode,
    handleRunDemo,
    handleEditorChange,
    handleExampleChange,
    createCurrentShareUrl,
    ...execution,
  }
}
