import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { HeapVisualizer } from './heap-visualizer'

describe('HeapVisualizer', () => {
  it('renders both heaps, the move, and current median', () => {
    render(
      <HeapVisualizer
        state={{
          snapshot: {
            heaps: [
              { name: 'minHeap', kind: 'min', values: [3, 4] },
              { name: 'maxHeap', kind: 'max', values: [2, 1] },
            ],
          },
          action: {
            description: 'Moved 3: maxHeap → minHeap',
            value: 3,
            targetHeapName: 'minHeap',
          },
          median: 2.5,
        }}
      />
    )

    expect(screen.getByText('Moved 3: maxHeap → minHeap')).toBeInTheDocument()
    expect(screen.getByText('Median: 2.5')).toBeInTheDocument()
    expect(screen.getByLabelText('Max Heap maxHeap')).toBeInTheDocument()
    expect(screen.getByLabelText('Min Heap minHeap')).toBeInTheDocument()
    expect(screen.getByText('Median: 2.5').closest('.pixel-panel')).toHaveClass(
      'w-full'
    )
  })

  it('shows the root for a single heap', () => {
    render(
      <HeapVisualizer
        state={{
          snapshot: {
            heaps: [{ name: 'minHeap', kind: 'min', values: [2, 4, 8, 5] }],
          },
          action: {
            description: 'Reordered minHeap',
            value: 2,
            targetHeapName: 'minHeap',
          },
          median: null,
        }}
      />
    )

    expect(screen.getByText('Reordered minHeap')).toBeInTheDocument()
    expect(screen.getByText(/Root:\s*2/)).toBeInTheDocument()
    expect(screen.getByLabelText('Min Heap minHeap')).toBeInTheDocument()
  })
})
