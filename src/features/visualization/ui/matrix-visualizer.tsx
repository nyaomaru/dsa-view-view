import React from 'react'
import { cn } from '@/shared/lib/class-names'
import { motion } from 'framer-motion'
import {
  isBoolean,
  isMatrix,
  isNil,
  isString,
  type MatrixValue,
} from '@/shared/lib/guards'
import { formatDisplayValue } from '../lib/display-value'

const MATRIX_CELL_MIN_WIDTH_REM = 7.5
const MATRIX_CELL_MIN_HEIGHT_CLASS = 'min-h-[7.5rem]'
const MATRIX_MIN_WIDTH_PER_COLUMN_REM = 7.875
const MATRIX_MAX_MIN_WIDTH_REM = 112.5
const CHANGED_CELL_INITIAL_SCALE = 1.1
const CHANGED_CELL_INITIAL_OPACITY = 0.8
const CELL_SPRING_STIFFNESS = 300
const CELL_SPRING_DAMPING = 20

const rem = (value: number) => `${value}rem`

/**
 * Props for MatrixVisualizer component.
 */
interface MatrixVisualizerProps {
  /** Matrix value to render. */
  data: MatrixValue
  /** Previous matrix value used to highlight changed cells. */
  previousData?: unknown
  /** Variable name shown in labels. */
  name: string
}

/**
 * Visualizes a 2D array as a grid.
 * Highlights cells that have changed since the previous execution step.
 */
export const MatrixVisualizer: React.FC<MatrixVisualizerProps> = ({
  data,
  previousData,
  name,
}) => {
  if (!isMatrix(data)) {
    return (
      <div className="p-4 text-muted-foreground italic text-center">
        Invalid matrix data for {name}
      </div>
    )
  }

  const rows = data.length
  const cols = data[0].length

  const prevMatrix =
    isMatrix(previousData) && previousData.length === rows ? previousData : null

  const renderCellContent = (val: unknown) => {
    if (isNil(val)) return ''
    if (isBoolean(val)) return val ? 'T' : 'F'
    return formatDisplayValue(val)
  }

  const getCellStyles = (_val: unknown, hasChanged: boolean) => {
    if (hasChanged) {
      return 'z-10 border-primary bg-primary/10 font-bold ring-2 ring-primary/30'
    }
    return 'border-border bg-background'
  }

  const getCellContentStyles = (val: unknown) =>
    isString(val)
      ? 'min-w-0 max-w-full break-all whitespace-normal text-center text-sm leading-relaxed'
      : 'text-4xl'

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-4 mb-2">
        <span className="text-base text-foreground">
          {rows} × {cols} Matrix
        </span>
      </div>

      <div className="w-full min-w-0 overflow-x-auto pb-2">
        <div
          className="mx-auto grid gap-0 border border-border rounded-md"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(${rem(MATRIX_CELL_MIN_WIDTH_REM)}, 1fr))`,
            minWidth: rem(
              Math.min(
                cols * MATRIX_MIN_WIDTH_PER_COLUMN_REM,
                MATRIX_MAX_MIN_WIDTH_REM
              )
            ),
          }}
        >
          {data.map((row, rIdx) => (
            <React.Fragment key={rIdx}>
              {row.map((val, cIdx) => {
                const hasChanged =
                  prevMatrix !== null &&
                  prevMatrix[rIdx] !== undefined &&
                  prevMatrix[rIdx]?.[cIdx] !== val

                return (
                  <motion.div
                    key={`${rIdx}-${cIdx}`}
                    layout
                    initial={
                      hasChanged
                        ? {
                            scale: CHANGED_CELL_INITIAL_SCALE,
                            opacity: CHANGED_CELL_INITIAL_OPACITY,
                          }
                        : false
                    }
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: CELL_SPRING_STIFFNESS,
                      damping: CELL_SPRING_DAMPING,
                    }}
                    className={cn(
                      `${MATRIX_CELL_MIN_HEIGHT_CLASS} min-w-0 overflow-hidden p-3 flex items-center justify-center font-mono text-foreground transition-colors duration-300 border relative`,
                      getCellStyles(val, hasChanged)
                    )}
                  >
                    <span className={getCellContentStyles(val)}>
                      {renderCellContent(val)}
                    </span>
                  </motion.div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold mt-2">
        Variable: {name}
      </div>
    </div>
  )
}
