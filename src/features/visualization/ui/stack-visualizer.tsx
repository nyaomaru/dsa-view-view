import { motion, AnimatePresence } from 'framer-motion'
import { Card, Badge } from '@/shared/ui'
import { isArray } from '@/shared/lib/guards'

const STACK_CONTAINER_MIN_HEIGHT_CLASS = 'min-h-[18.75rem]'
const STACK_ITEM_ENTER_Y_OFFSET = -50
const STACK_ITEM_EXIT_Y_OFFSET = -20
const STACK_ITEM_INITIAL_SCALE = 0.8
const STACK_ITEM_EXIT_SCALE = 0.5
const STACK_ITEM_SPRING_STIFFNESS = 300
const STACK_ITEM_SPRING_DAMPING = 25

/**
 * Props for StackVisualizer component.
 */
type StackVisualizerProps = {
  /** Source value, rendered as a stack when it is an array. */
  data: unknown
  /** Optional variable name shown above the stack. */
  name?: string
}

export function StackVisualizer({ data, name }: StackVisualizerProps) {
  // Ensure data is an array
  const stackData = isArray(data) ? data : []

  // Reverse for visual stack (top item at top)
  const displayData = [...stackData].reverse()

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4">
      {name && <h3 className="text-lg font-semibold mb-4 font-mono">{name}</h3>}

      <div
        className={`w-full max-w-xs bg-muted/20 rounded-b-lg border-b-4 border-x-4 border-muted p-4 ${STACK_CONTAINER_MIN_HEIGHT_CLASS} flex flex-col justify-end items-center relative gap-2`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {displayData.map((item, index) => {
            // Original index in the source array
            const originalIndex = stackData.length - 1 - index

            return (
              <motion.div
                key={`${originalIndex}-${String(item)}`}
                layout
                initial={{
                  opacity: 0,
                  y: STACK_ITEM_ENTER_Y_OFFSET,
                  scale: STACK_ITEM_INITIAL_SCALE,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: STACK_ITEM_EXIT_Y_OFFSET,
                  scale: STACK_ITEM_EXIT_SCALE,
                }}
                transition={{
                  type: 'spring',
                  stiffness: STACK_ITEM_SPRING_STIFFNESS,
                  damping: STACK_ITEM_SPRING_DAMPING,
                }}
                className="w-full"
              >
                <Card className="p-3 text-center border-primary/20 bg-card shadow-sm">
                  <span className="font-mono font-medium">{String(item)}</span>
                  <Badge
                    variant="outline"
                    className="ml-2 text-[0.625rem] text-muted-foreground"
                  >
                    idx: {originalIndex}
                  </Badge>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {stackData.length === 0 && (
          <div className="text-muted-foreground text-sm italic py-4">
            Empty Stack
          </div>
        )}
      </div>
      <div className="w-full max-w-xs text-center border-t border-muted/50 mt-2 pt-1">
        <span className="text-xs text-muted-foreground/70 uppercase tracking-widest">
          Bottom
        </span>
      </div>
    </div>
  )
}
