import type { CSSProperties, ReactNode } from 'react'

type CodeEditorFrameProps = {
  children?: ReactNode
  height?: CSSProperties['height']
}

export function CodeEditorFrame({
  children,
  height = '100%',
}: CodeEditorFrameProps) {
  return (
    <div
      className="pixel-editor-frame h-full w-full min-w-0 overflow-hidden p-[0.1875rem]"
      style={{ height }}
    >
      <div className="pixel-editor-viewport h-full w-full min-w-0 bg-[#1e1e1e]">
        {children}
      </div>
    </div>
  )
}
