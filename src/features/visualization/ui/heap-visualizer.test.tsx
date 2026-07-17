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
  })
})
