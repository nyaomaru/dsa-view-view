import { useEffect, useState } from 'react'
import type { UseFormRegister } from 'react-hook-form'
import {
  isParamTypeArrayLike,
  isParamTypeBoolean,
  isParamTypeGraphNode,
  isParamTypeListNode,
  isParamTypeListNodeArray,
  isParamTypeMatrix,
  isParamTypeNumber,
  isParamTypeTreeNode,
  type FunctionParameter,
} from '@/entities/code'
import type { TreeNodeReferenceOption } from '@/entities/data-structure'
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
} from '@/shared/ui'

type ParameterInputFormValues = Record<string, unknown>

type ParameterInputFieldProps = {
  param: FunctionParameter
  primaryTreeParamName?: string
  treeReferenceOptions?: TreeNodeReferenceOption[]
  treeReferenceValue?: string
  hasDuplicateTreeValues?: boolean
  register: UseFormRegister<ParameterInputFormValues>
  onTreeReferenceChange?: (name: string, value: string) => void
  errorMessage?: string
}

const getInputType = (param: FunctionParameter): string => {
  if (isParamTypeNumber(param)) return 'number'
  if (isParamTypeBoolean(param)) return 'checkbox'
  return 'text'
}

const getPlaceholder = (
  param: FunctionParameter,
  primaryTreeParamName?: string
): string => {
  switch (param.type) {
    case 'number':
      return 'Enter a number'
    case 'string':
      return 'Enter text'
    case 'boolean':
      return 'true or false'
    case 'number-array':
      return 'e.g., [1,2,3,4] or 1, 2, 3, 4'
    case 'string-array':
      return 'e.g., apple, banana, cherry'
    case 'boolean-array':
      return 'e.g., true, false, true'
    case 'number-matrix':
      return 'e.g., [[1, 0], [0, 1]]'
    case 'string-matrix':
    case 'boolean-matrix':
      return 'e.g., [["a", "b"], ["c", "d"]]'
    case 'array':
      return 'e.g., value1, value2, value3'
    case 'tree-node':
      return param.name === primaryTreeParamName
        ? 'e.g., [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5]'
        : 'e.g., 2'
    case 'list-node':
      return 'Node value'
    case 'list-node-array':
      return 'e.g., [[1,4,5],[1,3,4],[2,6]]'
    case 'graph-node':
      return 'e.g., [[2,4],[1,3],[2,4],[1,3]]'
    default:
      return `Enter ${param.type}`
  }
}

const getHelperText = (
  param: FunctionParameter,
  primaryTreeParamName?: string
): string | null => {
  if (isParamTypeListNodeArray(param)) {
    return 'Enter each linked list as an array inside a JSON array.'
  }
  if (isParamTypeArrayLike(param)) {
    return 'Enter a JSON array or values separated by commas'
  }
  if (isParamTypeMatrix(param)) {
    return 'Enter a valid JSON 2D array'
  }
  if (isParamTypeTreeNode(param)) {
    return param.name === primaryTreeParamName
      ? 'Use level-order input. Brackets are optional, and null marks missing children.'
      : 'Enter a node value from the root tree. For example, 2 selects the node with value 2.'
  }
  if (isParamTypeListNode(param)) {
    return 'Use array mode for [3,2,0,-4], or node mode for row-by-row values.'
  }
  if (isParamTypeGraphNode(param)) {
    return 'Use a LeetCode adjacency list. Node values are 1-based indexes.'
  }
  return null
}

/**
 * Renders the appropriate control for one parsed function parameter.
 *
 * Tree reference parameters use a node selector; all other parameter types use
 * a registered native input with type-specific placeholder and helper text.
 *
 * @param props Parameter metadata, form registration, and tree reference state.
 * @returns A labeled parameter control with validation feedback.
 */
export function ParameterInputField({
  param,
  primaryTreeParamName,
  treeReferenceOptions = [],
  treeReferenceValue = '',
  hasDuplicateTreeValues = false,
  register,
  onTreeReferenceChange,
  errorMessage,
}: ParameterInputFieldProps) {
  const helperText = getHelperText(param, primaryTreeParamName)
  const isTreeReferenceField =
    isParamTypeTreeNode(param) && param.name !== primaryTreeParamName
  const [selectedTreeReference, setSelectedTreeReference] =
    useState(treeReferenceValue)

  useEffect(() => {
    setSelectedTreeReference(treeReferenceValue)
  }, [treeReferenceValue])

  return (
    <Stack spacing="xs">
      <Label htmlFor={param.name}>
        {param.name}
        {param.optional && (
          <span className="text-muted-foreground ml-1">(optional)</span>
        )}
        <span className="text-xs text-muted-foreground ml-2">{param.type}</span>
      </Label>
      {isTreeReferenceField ? (
        <>
          <input
            type="hidden"
            name={param.name}
            value={selectedTreeReference}
            readOnly
          />
          <Select
            value={selectedTreeReference}
            onValueChange={(value) => {
              setSelectedTreeReference(value)
              onTreeReferenceChange?.(param.name, value)
            }}
            disabled={treeReferenceOptions.length === 0}
          >
            <SelectTrigger
              id={param.name}
              className={errorMessage ? 'border-destructive' : ''}
            >
              <SelectValue placeholder="Select a node from root" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">null</SelectItem>
              {treeReferenceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      ) : (
        <Input
          id={param.name}
          type={getInputType(param)}
          placeholder={getPlaceholder(param, primaryTreeParamName)}
          {...register(param.name, {
            valueAsNumber: isParamTypeNumber(param),
          })}
          className={errorMessage ? 'border-destructive' : ''}
        />
      )}
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {isTreeReferenceField && hasDuplicateTreeValues && (
        <p className="text-xs text-muted-foreground">
          Duplicate values detected. This selector uses path-based references
          such as path:L/R so p and q point to the exact node.
        </p>
      )}
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
    </Stack>
  )
}
