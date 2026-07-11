import { Plus, Trash2 } from 'lucide-react'
import { isParamTypeListNode, type FunctionParameter } from '@/entities/code'
import { NO_CYCLE_POSITION } from '@/entities/data-structure'
import { isBoolean, isNumber, isString, isUndefined } from '@/shared/lib/guards'
import { Button, Input, Label, Stack } from '@/shared/ui'

/** Editable value for one linked-list node row. */
export type ListNodeFormRow = {
  /** Raw node value entered by the user. */
  val: string
}

/** Form state for array and row-based linked-list entry modes. */
export type ListNodeFormState = {
  /** Active input representation. */
  mode: 'array' | 'nodes'
  /** Raw level-order list values used in array mode. */
  arrayText: string
  /** Individually editable nodes used in row mode. */
  rows: ListNodeFormRow[]
  /** Raw cycle target index, or `-1` when no cycle is requested. */
  pos: string
}

/** Runtime-neutral linked-list input emitted by the form. */
export type NormalizedListNodeInput =
  | { values: string; pos: string }
  | { rows: ListNodeFormRow[]; pos: string }

type ListNodeInputProps = {
  param: FunctionParameter
  value: ListNodeFormState
  onChange: (value: ListNodeFormState) => void
}

/**
 * Renders array or row-based controls for a linked-list parameter.
 *
 * @param props Parameter metadata, controlled state, and change callback.
 * @returns Linked-list input controls including the optional cycle target.
 */
export function ListNodeInput({ param, value, onChange }: ListNodeInputProps) {
  const { arrayText, mode, rows, pos } = value

  const updateRow = (index: number, val: string) => {
    onChange({
      ...value,
      rows: rows.map((row, rowIndex) => (rowIndex === index ? { val } : row)),
    })
  }

  const removeRow = (index: number) => {
    onChange({
      ...value,
      rows: rows.filter((_, rowIndex) => rowIndex !== index),
    })
  }

  const updatePos = (nextPos: string) => {
    onChange({
      ...value,
      pos: nextPos,
    })
  }

  const updateMode = (nextMode: ListNodeFormState['mode']) => {
    onChange({
      ...value,
      mode: nextMode,
    })
  }

  const updateArrayText = (nextArrayText: string) => {
    onChange({
      ...value,
      arrayText: nextArrayText,
    })
  }

  return (
    <Stack spacing="xs">
      <Label htmlFor={`${param.name}.0.val`}>
        {param.name}
        {param.optional && (
          <span className="text-muted-foreground ml-1">(optional)</span>
        )}
        <span className="text-xs text-muted-foreground ml-2">{param.type}</span>
      </Label>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={mode === 'array' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateMode('array')}
        >
          Array
        </Button>
        <Button
          type="button"
          variant={mode === 'nodes' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateMode('nodes')}
        >
          Nodes
        </Button>
      </div>

      {mode === 'array' ? (
        <Input
          id={`${param.name}.values`}
          placeholder="e.g., [3, 2, 0, -4]"
          value={arrayText}
          onChange={(event) => updateArrayText(event.target.value)}
        />
      ) : (
        <>
          <Stack spacing="xs">
            {rows.map((row, index) => (
              <div
                key={`${param.name}-${index}`}
                className="flex items-center gap-2"
              >
                <Input
                  id={`${param.name}.${index}.val`}
                  placeholder={`Node ${index + 1} val`}
                  value={row.val}
                  onChange={(event) => updateRow(index, event.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={rows.length === 1}
                  aria-label={`Remove ${param.name} node ${index + 1}`}
                  onClick={() => removeRow(index)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </Stack>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 w-full gap-2"
            onClick={() => onChange({ ...value, rows: [...rows, { val: '' }] })}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add node
          </Button>
        </>
      )}

      <div className="space-y-1">
        <Label htmlFor={`${param.name}.pos`}>Cycle target index</Label>
        <Input
          id={`${param.name}.pos`}
          type="number"
          min={NO_CYCLE_POSITION}
          step={1}
          value={pos}
          onChange={(event) => updatePos(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Use {NO_CYCLE_POSITION} for no cycle. Any other value connects the
          tail to that 0-indexed node.
        </p>
      </div>
    </Stack>
  )
}

/**
 * Creates the initial controlled state for one linked-list input.
 *
 * @param arrayText Initial array-mode text.
 * @returns A new linked-list form state with no cycle.
 */
export const createDefaultListNodeState = (
  arrayText: string = ''
): ListNodeFormState => ({
  mode: 'array',
  arrayText,
  rows: [{ val: '' }],
  pos: String(NO_CYCLE_POSITION),
})

const formatDefaultListNodeInput = (value: unknown): string => {
  if (isUndefined(value)) return ''
  if (isString(value)) return value
  if (isNumber(value) || isBoolean(value)) {
    return String(value)
  }

  return JSON.stringify(value)
}

/**
 * Creates controlled linked-list states for every list parameter.
 *
 * @param parameters Parsed function parameters.
 * @param defaultInputValues Optional raw defaults keyed by parameter name.
 * @returns Linked-list states keyed by list parameter name.
 */
export const createDefaultListNodeInputs = (
  parameters: FunctionParameter[],
  defaultInputValues: Record<string, unknown> = {}
): Record<string, ListNodeFormState> =>
  parameters.reduce<Record<string, ListNodeFormState>>((values, param) => {
    if (isParamTypeListNode(param)) {
      const defaultValue = defaultInputValues[param.name]
      values[param.name] = createDefaultListNodeState(
        formatDefaultListNodeInput(defaultValue)
      )
    }

    return values
  }, {})

const normalizeListNodeInput = (
  value: ListNodeFormState
): NormalizedListNodeInput =>
  value.mode === 'array'
    ? { values: value.arrayText, pos: value.pos }
    : { rows: value.rows, pos: value.pos }

/**
 * Converts controlled linked-list states into raw structured inputs.
 *
 * @param listNodeInputs States keyed by parameter name.
 * @returns Normalized array-mode or row-mode inputs keyed by parameter name.
 */
export const normalizeListNodeInputs = (
  listNodeInputs: Record<string, ListNodeFormState>
): Record<string, NormalizedListNodeInput> =>
  Object.fromEntries(
    Object.entries(listNodeInputs).map(([name, value]) => [
      name,
      normalizeListNodeInput(value),
    ])
  )
