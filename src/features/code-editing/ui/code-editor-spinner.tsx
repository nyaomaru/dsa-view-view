const CODE_EDITOR_WAIT_SOURCE = '/view-view-animation/wait.png'

export function CodeEditorSpinner() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#1e1e1e]">
      <div className="flex size-80 items-center justify-center overflow-visible">
        <img
          src={CODE_EDITOR_WAIT_SOURCE}
          alt=""
          aria-hidden="true"
          className="code-editor-wait-spinner h-auto w-64"
        />
      </div>
    </div>
  )
}
