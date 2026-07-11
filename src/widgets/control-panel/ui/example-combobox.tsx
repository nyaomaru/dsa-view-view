import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/shared/ui'
import {
  createExampleSearchIndex,
  groupExamplesByCategory,
  searchExamples,
} from '../model/example-search'
import type { AlgorithmExampleOption } from '../model/types'

type ExampleComboboxProps = {
  examples: AlgorithmExampleOption[]
  selectedExampleId: string
  onExampleChange: (exampleId: string) => void
}

export function ExampleCombobox({
  examples,
  selectedExampleId,
  onExampleChange,
}: ExampleComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectedExample = examples.find(
    (example) => example.id === selectedExampleId
  )
  const searchIndex = useMemo(
    () => createExampleSearchIndex(examples),
    [examples]
  )
  const groupedExamples = useMemo(
    () => groupExamplesByCategory(searchExamples(searchIndex, search)),
    [searchIndex, search]
  )

  useEffect(() => {
    if (!open) return

    searchInputRef.current?.focus()

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [open])

  const handleSelect = (exampleId: string) => {
    onExampleChange(exampleId)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id="algorithm-example"
        type="button"
        role="combobox"
        aria-label="Example"
        aria-expanded={open}
        aria-haspopup="listbox"
        className="pixel-field [--pixel-field-shell:rgb(var(--input))] [--pixel-field-fill:rgb(var(--background))] flex h-9 w-full cursor-pointer items-center justify-between whitespace-nowrap border border-input px-3 py-2 text-sm shadow-sm ring-offset-background transition-colors hover:border-ring hover:[--pixel-field-fill:rgb(var(--secondary))] focus:outline-none focus:ring-1 focus:ring-ring"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">
          {selectedExample?.label ??
            (selectedExampleId === 'custom'
              ? 'Custom code'
              : 'Choose an example')}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="ml-2 h-4 w-4 shrink-0 text-muted-foreground"
        />
      </button>
      {open && (
        <div className="pixel-panel absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-hidden border bg-popover p-2 text-popover-foreground shadow-md">
          <Input
            ref={searchInputRef}
            aria-label="Search examples"
            placeholder="Search examples..."
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false)
              }
            }}
          />
          <div role="listbox" className="mt-2 max-h-60 overflow-y-auto">
            {selectedExampleId === 'custom' && (
              <div className="px-5 py-1.5 text-sm text-muted-foreground">
                Custom code
              </div>
            )}
            {groupedExamples.length > 0 ? (
              groupedExamples.map(([category, categoryExamples]) => (
                <div key={category}>
                  <div className="px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    {category}
                  </div>
                  {categoryExamples.map((example) => (
                    <button
                      key={example.id}
                      type="button"
                      role="option"
                      aria-selected={example.id === selectedExampleId}
                      className={[
                        'block w-full cursor-pointer rounded-sm py-1.5 pl-5 pr-2 text-left text-sm outline-none hover:bg-secondary hover:text-secondary-foreground focus:bg-secondary focus:text-secondary-foreground',
                        example.id === selectedExampleId
                          ? 'font-semibold text-primary'
                          : '',
                      ].join(' ')}
                      onClick={() => handleSelect(example.id)}
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              ))
            ) : (
              <div className="px-2 py-3 text-sm text-muted-foreground">
                No examples found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
