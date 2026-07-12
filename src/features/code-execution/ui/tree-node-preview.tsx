import type { TreeNodeValue } from '@/entities/data-structure'
import { isNull, isString, isUndefined } from '@/shared/lib/guards'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'

type TreeNodePreviewProps = {
  root: TreeNodeValue | null
}

function formatNodeValue(value: unknown): string {
  if (isString(value)) return value
  if (isNull(value)) return 'null'
  if (isUndefined(value)) return 'undefined'
  return JSON.stringify(value)
}

function TreeNodePreviewBranch({
  node,
  label,
}: {
  node: TreeNodeValue | null
  label: string
}) {
  if (isNull(node)) {
    return (
      <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="rounded border border-dashed px-2 py-1 font-mono">
          null
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="rounded-md border bg-background px-3 py-2 font-mono text-sm font-semibold">
        {formatNodeValue(node.val)}
      </div>
      {(!isNull(node.left) || !isNull(node.right)) && (
        <div className="grid grid-cols-2 gap-3">
          <TreeNodePreviewBranch node={node.left} label="L" />
          <TreeNodePreviewBranch node={node.right} label="R" />
        </div>
      )}
    </div>
  )
}

/**
 * Renders a compact recursive preview of a parsed binary tree root.
 *
 * @param props Parsed root node, or `null` for an empty tree.
 * @returns A tree preview card with left and right branch labels.
 */
export function TreeNodePreview({ root }: TreeNodePreviewProps) {
  return (
    <Card className="border-dashed shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Root tree preview</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {!isNull(root) ? (
          <div className="overflow-x-auto overflow-y-hidden px-2 pb-1">
            <div className="min-w-max">
              <TreeNodePreviewBranch node={root} label="root" />
            </div>
          </div>
        ) : (
          <p className="text-sm text-card-foreground">root is null</p>
        )}
      </CardContent>
    </Card>
  )
}
