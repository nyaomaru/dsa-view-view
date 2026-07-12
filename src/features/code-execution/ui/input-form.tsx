import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Stack,
} from '@/shared/ui'
import {
  isParamTypeBoolean,
  isParamTypeListNode,
  isParamTypeNumber,
  isParamTypeTreeNode,
  type FunctionParameter,
  type FunctionSignature,
} from '@/entities/code'
import {
  getTreeNodeReferenceOptions,
  getTreeNodeReferenceValue,
  parseTreeInput,
} from '@/entities/data-structure'
import { equals, isString } from '@/shared/lib/guards'
import { validateInputs } from '../lib/validator'
import { convertInputValues } from '../lib/structured-inputs'
import { ClassDesignInputForm } from './class-design-input-form'
import {
  ListNodeInput,
  createDefaultListNodeInputs,
  createDefaultListNodeState,
  normalizeListNodeInputs,
  type ListNodeFormState,
} from './list-node-input'
import { ParameterInputField } from './parameter-input-field'
import { TreeNodePreview } from './tree-node-preview'

/**
 * Raw react-hook-form values keyed by parameter name.
 */
type InputFormValues = Record<string, unknown>

const EMPTY_DEFAULT_INPUT_VALUES: Record<string, unknown> = {}
const isEmptyString = equals('')

const createDefaultInputValues = (
  parameters: FunctionParameter[],
  defaultInputValues: Record<string, unknown> = {}
): InputFormValues =>
  Object.fromEntries(
    parameters.map((param) => [
      param.name,
      defaultInputValues[param.name] ?? '',
    ])
  )

/**
 * Props for InputForm component.
 */
type InputFormProps = {
  /** Function or class signature used to build input controls. */
  signature: FunctionSignature
  /** Optional initial values used to prefill example inputs. */
  defaultInputValues?: Record<string, unknown>
  /** Callback invoked with converted input values on submit. */
  onSubmit: (values: Record<string, unknown>) => void
  /** Callback invoked with raw form values suitable for restoring/share URLs. */
  onRawInputChange?: (values: Record<string, unknown>) => void
}

/**
 * Dynamic form generator based on function parameters
 *
 * Automatically creates input fields for each function parameter
 * with appropriate type validation using Zod and react-hook-form.
 *
 * @param props - Component props
 * @returns InputForm component
 *
 * @example
 * ```tsx
 * <InputForm
 *   signature={functionSignature}
 *   onSubmit={(values) => console.log(values)}
 * />
 * ```
 */
function InputFormContent({
  signature,
  defaultInputValues,
  onSubmit,
  onRawInputChange,
}: InputFormProps) {
  const resolvedDefaultInputValues =
    defaultInputValues ?? EMPTY_DEFAULT_INPUT_VALUES
  const hasMountedRef = useRef(false)
  const primaryTreeParamName =
    signature.parameters.find(isParamTypeTreeNode)?.name
  const [listNodeInputs, setListNodeInputs] = useState<
    Record<string, ListNodeFormState>
  >(() =>
    createDefaultListNodeInputs(
      signature.parameters,
      resolvedDefaultInputValues
    )
  )
  const defaultValues = createDefaultInputValues(
    signature.parameters,
    resolvedDefaultInputValues
  )

  const {
    register,
    reset,
    watch,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<InputFormValues>({
    defaultValues,
  })
  const watchedPrimaryTreeInput = watch(primaryTreeParamName ?? '')
  const primaryTreeInput =
    watchedPrimaryTreeInput ??
    (primaryTreeParamName
      ? resolvedDefaultInputValues[primaryTreeParamName]
      : undefined)
  const primaryTreeRoot = primaryTreeParamName
    ? parseTreeInput(primaryTreeInput)
    : null
  const treeReferenceOptions = getTreeNodeReferenceOptions(primaryTreeRoot)
  const hasDuplicateTreeValues = treeReferenceOptions.some(
    (option) => option.isDuplicateValue
  )

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    reset(
      createDefaultInputValues(signature.parameters, resolvedDefaultInputValues)
    )
    setListNodeInputs(
      createDefaultListNodeInputs(
        signature.parameters,
        resolvedDefaultInputValues
      )
    )
  }, [reset, resolvedDefaultInputValues, signature.parameters])

  if (signature.kind === 'class') {
    return <ClassDesignInputForm signature={signature} onSubmit={onSubmit} />
  }

  const getRawFormValues = (form: HTMLFormElement): Record<string, unknown> => {
    const formData = new FormData(form)
    return Object.fromEntries(
      signature.parameters
        .filter((param) => !isParamTypeListNode(param))
        .map((param) => {
          if (isParamTypeBoolean(param)) {
            return [param.name, formData.has(param.name)]
          }

          const value = formData.get(param.name)
          if (isParamTypeNumber(param)) {
            return [
              param.name,
              isString(value) && !isEmptyString(value)
                ? Number(value)
                : Number.NaN,
            ]
          }

          return [param.name, isString(value) ? value : '']
        })
    )
  }

  const onFormChange = (event: FormEvent<HTMLFormElement>) => {
    onRawInputChange?.({
      ...getRawFormValues(event.currentTarget),
      ...normalizeListNodeInputs(listNodeInputs),
    })
  }

  /**
   * Handles form submission
   */
  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const data = getRawFormValues(event.currentTarget)
    const normalizedListNodeInputs = normalizeListNodeInputs(listNodeInputs)
    const rawInputs = {
      ...data,
      ...normalizedListNodeInputs,
    }
    const validation = validateInputs(signature.parameters, rawInputs)

    clearErrors()

    if (!validation.success) {
      Object.entries(validation.errors ?? {}).forEach(([name, message]) => {
        setError(name, { type: 'validate', message })
      })
      return
    }

    onRawInputChange?.(rawInputs)
    onSubmit(convertInputValues(signature.parameters, rawInputs))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Input Parameters</CardTitle>
        <CardDescription>
          Enter values for <code className="font-mono">{signature.name}</code>{' '}
          function
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onChange={onFormChange} onSubmit={onFormSubmit}>
          <Stack spacing="md">
            {signature.parameters.map((param) => {
              if (isParamTypeListNode(param)) {
                return (
                  <ListNodeInput
                    key={param.name}
                    param={param}
                    value={
                      listNodeInputs[param.name] ?? createDefaultListNodeState()
                    }
                    onChange={(value) => {
                      setListNodeInputs((current) => ({
                        ...current,
                        [param.name]: value,
                      }))
                      onRawInputChange?.({
                        ...createDefaultInputValues(
                          signature.parameters,
                          resolvedDefaultInputValues
                        ),
                        ...normalizeListNodeInputs({
                          ...listNodeInputs,
                          [param.name]: value,
                        }),
                      })
                    }}
                  />
                )
              }

              return (
                <div key={param.name} className="space-y-3">
                  <ParameterInputField
                    param={param}
                    primaryTreeParamName={primaryTreeParamName}
                    treeReferenceOptions={treeReferenceOptions}
                    treeReferenceValue={
                      isParamTypeTreeNode(param) &&
                      param.name !== primaryTreeParamName
                        ? getTreeNodeReferenceValue(
                            primaryTreeRoot,
                            resolvedDefaultInputValues[param.name]
                          )
                        : undefined
                    }
                    hasDuplicateTreeValues={hasDuplicateTreeValues}
                    register={register}
                    onTreeReferenceChange={(name, value) => {
                      onRawInputChange?.({
                        ...createDefaultInputValues(
                          signature.parameters,
                          resolvedDefaultInputValues
                        ),
                        ...(primaryTreeParamName
                          ? { [primaryTreeParamName]: primaryTreeInput }
                          : {}),
                        [name]: value,
                        ...normalizeListNodeInputs(listNodeInputs),
                      })
                    }}
                    errorMessage={errors[param.name]?.message as string}
                  />
                  {param.name === primaryTreeParamName && (
                    <TreeNodePreview root={primaryTreeRoot} />
                  )}
                </div>
              )
            })}

            <Button type="submit" className="w-full">
              Run
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  )
}

/**
 * Renders input controls for a function or class signature.
 *
 * @param props Signature, initial values, and submission callbacks.
 * @returns A keyed input form that resets when the signature changes.
 */
export function InputForm(props: InputFormProps) {
  return <InputFormContent key={JSON.stringify(props.signature)} {...props} />
}
