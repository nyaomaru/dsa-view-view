import {
  isInteger,
  isMap,
  isNumber,
  isNumericArray,
  isString,
} from '@/shared/lib/guards'

type MapEntry = {
  key: string | number
  value: number
}

export type LookupMapState = {
  mode: 'lookup'
  mapName: 'seen'
  entries: MapEntry[]
  data: number[]
  currentIndex: number
  target: number
  complement: number
  matchedIndex?: number
}

export type FrequencyMapState = {
  mode: 'frequency'
  mapName: 'counts'
  entries: MapEntry[]
  source: string
  comparison: string
  currentChar?: string
}

export type MapVisualizationState = LookupMapState | FrequencyMapState

function getNumericMapEntries(value: Map<unknown, unknown>): MapEntry[] | null {
  const entries: MapEntry[] = []

  for (const [key, item] of value) {
    if ((!isNumber(key) && !isString(key)) || !isNumber(item)) return null
    entries.push({ key, value: item })
  }

  return entries
}

function getLookupMapState(
  mapName: string,
  value: Map<unknown, unknown>,
  variables: Record<string, unknown>
): LookupMapState | null {
  if (mapName !== 'seen') return null

  const nums = variables.nums
  const currentIndex = variables.i
  const target = variables.target
  const complementVariable = variables.complement
  const pairVariable = variables.pair
  const complement = isNumber(complementVariable)
    ? complementVariable
    : pairVariable
  const entries = getNumericMapEntries(value)

  if (
    !isNumericArray(nums) ||
    !isInteger(currentIndex) ||
    !isNumber(target) ||
    !isNumber(complement) ||
    !entries ||
    currentIndex < 0 ||
    currentIndex >= nums.length
  ) {
    return null
  }

  const matchedIndex = value.get(complement)

  return {
    mode: 'lookup',
    mapName: 'seen',
    entries,
    data: nums.map(Number),
    currentIndex,
    target,
    complement,
    matchedIndex: isNumber(matchedIndex) ? matchedIndex : undefined,
  }
}

function getFrequencyMapState(
  mapName: string,
  value: Map<unknown, unknown>,
  variables: Record<string, unknown>
): FrequencyMapState | null {
  if (mapName !== 'counts') return null

  const source = variables.s
  const comparison = variables.t
  const currentChar = variables.char
  const entries = getNumericMapEntries(value)

  if (!isString(source) || !isString(comparison) || !entries) return null

  return {
    mode: 'frequency',
    mapName: 'counts',
    entries,
    source,
    comparison,
    currentChar: isString(currentChar) ? currentChar : undefined,
  }
}

export function getMapVisualizationState(
  mapName: string,
  value: unknown,
  variables: Record<string, unknown>
): MapVisualizationState | null {
  if (!isMap(value)) return null

  return (
    getLookupMapState(mapName, value, variables) ??
    getFrequencyMapState(mapName, value, variables)
  )
}
