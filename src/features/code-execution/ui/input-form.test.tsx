import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

import type { FunctionSignature } from '@/entities/code'

import { InputForm } from './input-form'

type TestListNode = {
  val: number
  next: TestListNode | null
}

const listSignature: FunctionSignature = {
  name: 'reverseList',
  parameters: [{ name: 'head', type: 'list-node', optional: false }],
  returnType: 'list-node',
}

const listArraySignature: FunctionSignature = {
  name: 'mergeKLists',
  parameters: [
    { name: 'lists', type: 'list-node-array', optional: false },
  ],
  returnType: 'list-node',
}

const binarySearchSignature: FunctionSignature = {
  name: 'binarySearch',
  parameters: [
    { name: 'nums', type: 'number-array', optional: false },
    { name: 'target', type: 'number', optional: false },
  ],
  returnType: 'number',
}

const accountMergeSignature: FunctionSignature = {
  name: 'accountMerge',
  parameters: [{ name: 'accounts', type: 'string-matrix', optional: false }],
  returnType: 'string-matrix',
}

const numberMatrixSignature: FunctionSignature = {
  name: 'sumGrid',
  parameters: [{ name: 'accounts', type: 'number-matrix', optional: false }],
  returnType: 'number',
}

const lowestCommonAncestorSignature: FunctionSignature = {
  name: 'lowestCommonAncestor',
  parameters: [
    { name: 'root', type: 'tree-node', optional: false },
    { name: 'p', type: 'tree-node', optional: false },
    { name: 'q', type: 'tree-node', optional: false },
  ],
  returnType: 'tree-node',
}

function listToArray(node: TestListNode | null): number[] {
  const values: number[] = []
  let current = node

  while (current) {
    values.push(current.val)
    current = current.next
  }

  return values
}

describe('InputForm ListNode inputs', () => {
  it('prefills primitive and array parameters from default input values', () => {
    render(
      <InputForm
        signature={binarySearchSignature}
        defaultInputValues={{
          nums: '[1, 3, 5, 7, 9]',
          target: 7,
        }}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/nums/)).toHaveValue('[1, 3, 5, 7, 9]')
    expect(screen.getByLabelText(/target/)).toHaveValue(7)
  })

  it('prefills ListNode array mode from default input values', () => {
    render(
      <InputForm
        signature={listSignature}
        defaultInputValues={{ head: '[1, 2, 3, 4, 5]' }}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByPlaceholderText('e.g., [3, 2, 0, -4]')).toHaveValue(
      '[1, 2, 3, 4, 5]'
    )
  })

  it('shows a root tree preview and uses selectors for TreeNode references', () => {
    const { container } = render(
      <InputForm
        signature={lowestCommonAncestorSignature}
        defaultInputValues={{
          root: '[6,2,8,0,4,7,9,null,null,3,5]',
          p: 5,
          q: 4,
        }}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByText('Root tree preview')).toBeInTheDocument()
    expect(screen.getAllByText('root').length).toBeGreaterThan(0)
    expect(screen.getByLabelText(/root/)).toHaveValue(
      '[6,2,8,0,4,7,9,null,null,3,5]'
    )
    expect(container.querySelector('input[name="p"]')).toHaveValue('value:5')
    expect(container.querySelector('input[name="q"]')).toHaveValue('value:4')
    expect(
      screen.getAllByText(
        'Enter a node value from the root tree. For example, 2 selects the node with value 2.'
      ).length
    ).toBeGreaterThan(0)
  })

  it('explains duplicate TreeNode values when references need paths', () => {
    const { container } = render(
      <InputForm
        signature={lowestCommonAncestorSignature}
        defaultInputValues={{
          root: '[1,2,2]',
          p: 2,
          q: 'path:R',
        }}
        onSubmit={vi.fn()}
      />
    )

    expect(container.querySelector('input[name="p"]')).toHaveValue('path:L')
    expect(container.querySelector('input[name="q"]')).toHaveValue('path:R')
    expect(
      screen.getAllByText(
        'Duplicate values detected. This selector uses path-based references such as path:L/R so p and q point to the exact node.'
      ).length
    ).toBeGreaterThan(0)
  })

  it('shows cycle target input with no-cycle guidance instead of a separate cycle button', () => {
    render(<InputForm signature={listSignature} onSubmit={vi.fn()} />)

    expect(screen.getByLabelText('Cycle target index')).toHaveValue(-1)
    expect(
      screen.getByText(
        'Use -1 for no cycle. Any other value connects the tail to that 0-indexed node.'
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Cycle' })
    ).not.toBeInTheDocument()
  })

  it('submits a normal acyclic list when cycle target index is -1', async () => {
    const handleSubmit = vi.fn()

    render(<InputForm signature={listSignature} onSubmit={handleSubmit} />)

    fireEvent.change(screen.getByPlaceholderText('e.g., [3, 2, 0, -4]'), {
      target: { value: '[1,2,3]' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })

    const submitted = handleSubmit.mock.calls[0][0] as {
      head: TestListNode | null
    }
    expect(listToArray(submitted.head)).toEqual([1, 2, 3])
    expect(submitted.head?.next?.next?.next).toBeNull()
  })

  it('submits each nested array as a linked list', async () => {
    const handleSubmit = vi.fn()

    render(<InputForm signature={listArraySignature} onSubmit={handleSubmit} />)

    fireEvent.change(screen.getByLabelText(/lists/), {
      target: { value: '[[1,4,5],[1,3,4],[2,6]]' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })

    const submitted = handleSubmit.mock.calls[0][0] as {
      lists: (TestListNode | null)[]
    }
    expect(submitted.lists.map(listToArray)).toEqual([
      [1, 4, 5],
      [1, 3, 4],
      [2, 6],
    ])
  })

  it('submits variable-length string matrix rows', async () => {
    const handleSubmit = vi.fn()
    const accounts =
      '[["John","johnsmith@mail.com","john_newyork@mail.com"],["John","johnsmith@mail.com","john00@mail.com"],["Mary","mary@mail.com"],["John","johnnybravo@mail.com"]]'

    render(
      <InputForm signature={accountMergeSignature} onSubmit={handleSubmit} />
    )

    fireEvent.change(screen.getByLabelText(/accounts/), {
      target: { value: accounts },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        accounts: [
          ['John', 'johnsmith@mail.com', 'john_newyork@mail.com'],
          ['John', 'johnsmith@mail.com', 'john00@mail.com'],
          ['Mary', 'mary@mail.com'],
          ['John', 'johnnybravo@mail.com'],
        ],
      })
    })

    expect(
      screen.queryByText(/Must be a JSON 2D array of strings/)
    ).not.toBeInTheDocument()
  })

  it('submits accounts merge input with equal-length rows', async () => {
    const handleSubmit = vi.fn()
    const accounts =
      '[["Gabe","Gabe0@m.co","Gabe3@m.co","Gabe1@m.co"],["Kevin","Kevin3@m.co","Kevin5@m.co","Kevin0@m.co"],["Ethan","Ethan5@m.co","Ethan4@m.co","Ethan0@m.co"],["Hanzo","Hanzo3@m.co","Hanzo1@m.co","Hanzo0@m.co"],["Fern","Fern5@m.co","Fern1@m.co","Fern0@m.co"]]'

    render(
      <InputForm signature={accountMergeSignature} onSubmit={handleSubmit} />
    )

    fireEvent.change(screen.getByLabelText(/accounts/), {
      target: { value: accounts },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })

    expect(
      screen.queryByText(/Must be a JSON 2D array of strings/)
    ).not.toBeInTheDocument()
  })

  it('validates the current DOM value when form state is stale', async () => {
    const handleSubmit = vi.fn()
    const accounts =
      '[["John","johnsmith@mail.com","john_newyork@mail.com"],["John","johnsmith@mail.com","john00@mail.com"],["Mary","mary@mail.com"],["John","johnnybravo@mail.com"]]'

    render(
      <InputForm signature={accountMergeSignature} onSubmit={handleSubmit} />
    )

    const input = screen.getByLabelText(/accounts/) as HTMLInputElement
    input.value = accounts
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        accounts: [
          ['John', 'johnsmith@mail.com', 'john_newyork@mail.com'],
          ['John', 'johnsmith@mail.com', 'john00@mail.com'],
          ['Mary', 'mary@mail.com'],
          ['John', 'johnnybravo@mail.com'],
        ],
      })
    })
  })

  it('uses the current validation schema after the signature changes', async () => {
    const handleSubmit = vi.fn()
    const accounts =
      '[["Gabe","Gabe0@m.co","Gabe3@m.co","Gabe1@m.co"],["Kevin","Kevin3@m.co","Kevin5@m.co","Kevin0@m.co"]]'
    const { rerender } = render(
      <InputForm signature={numberMatrixSignature} onSubmit={handleSubmit} />
    )

    fireEvent.change(screen.getByLabelText(/accounts/), {
      target: { value: accounts },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    await waitFor(() => {
      expect(
        screen.getByText(/Must be a JSON 2D array of numbers/)
      ).toBeInTheDocument()
    })

    rerender(
      <InputForm signature={accountMergeSignature} onSubmit={handleSubmit} />
    )
    fireEvent.change(screen.getByLabelText(/accounts/), {
      target: { value: accounts },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        accounts: [
          ['Gabe', 'Gabe0@m.co', 'Gabe3@m.co', 'Gabe1@m.co'],
          ['Kevin', 'Kevin3@m.co', 'Kevin5@m.co', 'Kevin0@m.co'],
        ],
      })
    })
  })
})
