import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/entities/code'
import {
  isExecutionState,
  type ExecutionState,
  type InputValues,
} from '@/entities/execution'
import {
  define,
  equals,
  hasKeys,
  isNonArrayObject,
  isString,
  isUndefined,
  oneOfValues,
  type Guard,
} from '@/shared/lib/guards'

export type ExecutionWorkerRequest = {
  type: 'execute'
  requestId: string
  code: string
  inputs: InputValues
  entryFunctionName?: string
  language: SupportedLanguage
}

export type ExecutionWorkerResponse =
  | {
      type: 'success'
      requestId: string
      state: ExecutionState
    }
  | {
      type: 'failure'
      requestId: string
      message: string
    }

const isSupportedLanguage = oneOfValues(...SUPPORTED_LANGUAGES)
const isExecuteRequest = equals('execute')
const isSuccessResponse = equals('success')
const isFailureResponse = equals('failure')
const hasRequestKeys = hasKeys(
  'type',
  'requestId',
  'code',
  'inputs',
  'language'
)
const hasResponseKeys = hasKeys('type', 'requestId')

export const isExecutionWorkerRequest: Guard<ExecutionWorkerRequest> =
  define<ExecutionWorkerRequest>((value) => {
    if (!isNonArrayObject(value) || !hasRequestKeys(value)) return false

    return (
      isExecuteRequest(value.type) &&
      isString(value.requestId) &&
      isString(value.code) &&
      isNonArrayObject(value.inputs) &&
      (isUndefined(value.entryFunctionName) ||
        isString(value.entryFunctionName)) &&
      isSupportedLanguage(value.language)
    )
  })

export const isExecutionWorkerResponse: Guard<ExecutionWorkerResponse> =
  define<ExecutionWorkerResponse>((value) => {
    if (!isNonArrayObject(value) || !hasResponseKeys(value)) return false
    if (!isString(value.requestId)) return false

    if (isSuccessResponse(value.type)) {
      return hasKeys('state')(value) && isExecutionState(value.state)
    }

    return (
      isFailureResponse(value.type) &&
      hasKeys('message')(value) &&
      isString(value.message)
    )
  })
