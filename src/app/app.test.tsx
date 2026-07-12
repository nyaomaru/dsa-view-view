import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

vi.mock('@/features/code-editing/code-editor', () => {
  return {
    prepareCodeEditor: vi.fn().mockResolvedValue(undefined),
    CodeEditor: ({
      value,
      onChange,
    }: {
      value: string
      onChange: (value: string) => void
    }) => (
      <textarea
        aria-label="Code Editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    ),
  }
})

vi.mock(
  '@/features/code-execution/worker/execution-worker-client',
  async () => {
    const { executeCode } = await vi.importActual<
      typeof import('@/features/code-execution/lib/runner')
    >('@/features/code-execution/lib/runner')

    return {
      executeCodeInWorker: async (
        code: string,
        inputs: Record<string, unknown>,
        entryFunctionName?: string
      ) => executeCode(code, inputs, entryFunctionName),
    }
  }
)

import App from './app'
import { ALGORITHM_EXAMPLES } from '@/entities/algorithm-example'
import { encodeShareState } from '@/features/shareable-url'

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: () => {},
  writable: true,
})

function mockMatchMedia(matches: boolean) {
  const originalMatchMedia = window.matchMedia

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  return () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    })
  }
}

describe('App runtime execution', () => {
  it('runs the default demo from a single button', async () => {
    window.history.pushState({}, '', '/')
    const restoreMatchMedia = mockMatchMedia(true)
    const quickSortIndex = ALGORITHM_EXAMPLES.findIndex(
      (example) => example.id === 'quick-sort'
    )
    expect(quickSortIndex).toBeGreaterThanOrEqual(0)
    const randomSpy = vi
      .spyOn(Math, 'random')
      .mockReturnValue((quickSortIndex + 0.1) / ALGORITHM_EXAMPLES.length)

    render(<App />)

    const runDemoButton = await screen.findByRole('button', {
      name: 'Run demo',
    })
    const editor = await screen.findByLabelText('Code Editor')

    expect(
      runDemoButton.compareDocumentPosition(editor) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()

    fireEvent.click(runDemoButton)

    await waitFor(
      () => {
        expect(screen.getByText('All execution steps')).toBeInTheDocument()
      },
      {
        timeout: 5000,
      }
    )

    expect(
      (screen.getByLabelText('Code Editor') as HTMLTextAreaElement).value
    ).toContain('function quickSort')
    expect(
      screen.getByRole('heading', { name: 'Bar Chart: nums' })
    ).toBeInTheDocument()
    expect(
      screen
        .getAllByTitle('Step Forward')
        .every((button) => button.hasAttribute('disabled'))
    ).toBe(true)
    randomSpy.mockRestore()
    restoreMatchMedia()
  })

  it('opens a built-in example from the example query parameter', async () => {
    window.history.pushState({}, '', '/?example=two-sum')

    render(<App />)

    expect(
      ((await screen.findByLabelText('Code Editor')) as HTMLTextAreaElement)
        .value
    ).toContain('function twoSum')

    window.history.pushState({}, '', '/')
  })

  it('restores custom code and raw inputs from an encoded share URL', async () => {
    const encoded = await encodeShareState({
      v: 1,
      c: `function echo(s: string): string {
  return s
}`,
      i: { s: 'hello' },
      m: 'verification',
    })
    window.history.pushState({}, '', `/#s=${encoded}`)

    render(<App />)

    expect(
      ((await screen.findByLabelText('Code Editor')) as HTMLTextAreaElement)
        .value
    ).toContain('function echo')
    expect(await screen.findByLabelText(/s/)).toHaveValue('hello')

    window.history.pushState({}, '', '/')
  })

  it('requires approval before running custom runtime shares', async () => {
    const encoded = await encodeShareState({
      v: 1,
      c: `function sum(nums: number[]): number {
  let total = 0

  for (const num of nums) {
    total += num
  }

  return total
}`,
      i: { nums: '1, 2, 3' },
      m: 'runtime',
      p: 2,
    })
    window.history.pushState({}, '', `/#s=${encoded}`)

    render(<App />)

    expect(
      ((await screen.findByLabelText('Code Editor')) as HTMLTextAreaElement)
        .value
    ).toContain('function sum')
    expect(
      await screen.findByRole('heading', { name: 'Run shared custom code?' })
    ).toBeInTheDocument()
    expect(screen.queryByText('All execution steps')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Run shared code' }))

    await waitFor(() => {
      expect(screen.getByText('All execution steps')).toBeInTheDocument()
    })

    expect(
      screen.getAllByText((_, element) =>
        Boolean(element?.textContent?.match(/^3 \/ \d+$/))
      ).length
    ).toBeGreaterThan(0)
    expect(screen.queryByText('Shared link error')).not.toBeInTheDocument()

    window.history.pushState({}, '', '/')
  })

  it('shows an error when a shared link cannot be restored', async () => {
    window.history.pushState({}, '', '/#s=not-a-valid-share-state')

    render(<App />)

    expect(await screen.findByText('Shared link error')).toBeInTheDocument()
    expect(
      screen.getByText(
        'This shared link is broken or incomplete. Ask for a new link.'
      )
    ).toBeInTheDocument()

    window.history.pushState({}, '', '/')
  })

  it('shows an error when a shared link is too large to restore', async () => {
    const encoded = await encodeShareState({
      v: 1,
      c: `function huge(): string {
  return '${'x'.repeat(64 * 1024 + 1)}'
}`,
    })
    window.history.pushState({}, '', `/#s=${encoded}`)

    render(<App />)

    expect(await screen.findByText('Shared link error')).toBeInTheDocument()
    expect(
      screen.getByText(
        'This shared link is too large to load. Ask for a shorter link or share a built-in example instead.'
      )
    ).toBeInTheDocument()

    window.history.pushState({}, '', '/')
  })

  it('shows assignment steps for xor accumulation code', async () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    fireEvent.change(await screen.findByLabelText('Code Editor'), {
      target: {
        value: `function singleNumber(nums: number[]): number {
  let result = 0

  for (const num of nums) {
    result ^= num
  }

  return result
}`,
      },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Compile Code' }))

    await waitFor(() => {
      expect(screen.getByText('Input Parameters')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/nums/), {
      target: { value: '1, 2, 2, 3, 1, 4, 3' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    await waitFor(() => {
      expect(screen.getByText('All execution steps')).toBeInTheDocument()
    })

    expect(screen.getAllByText('result ^= num -> 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('result ^= num -> 4').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('return from singleNumber line 8: result').length
    ).toBeGreaterThan(0)
  })

  it('accepts accounts merge string-matrix input after compiling the code', async () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    fireEvent.change(await screen.findByLabelText('Code Editor'), {
      target: {
        value: `function accountMerge(accounts: string[][]): string[][] {
  const dsu = new DSU()
  const emailToName = new Map<string, string>()
  const allEmails = new Set<string>()

  for (const account of accounts) {
    const name = account[0]
    const emails = account.slice(1)

    if (emails.length === 0) continue

    for (const email of emails) {
      emailToName.set(email, name)
      allEmails.add(email)
    }

    const first = emails[0]
    for (let i = 1; i < emails.length; i++) {
      dsu.union(first, emails[i])
    }
  }

  const groups = new Map<string, string[]>()
  for (const email of allEmails) {
    const root = dsu.find(email)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root)!.push(email)
  }

  const res: string[][] = []
  for (const [root, emails] of groups) {
    emails.sort()
    const nameFromRoot = emailToName.get(root)
    const nameFromFirstEmail = emailToName.get(emails[0])
    const name = nameFromRoot ?? nameFromFirstEmail ?? ''
    res.push([name, ...emails])
  }

  return res
}`,
      },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Compile Code' }))

    await waitFor(() => {
      expect(screen.getByText('Input Parameters')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/accounts/), {
      target: {
        value:
          '[["Gabe","Gabe0@m.co","Gabe3@m.co","Gabe1@m.co"],["Kevin","Kevin3@m.co","Kevin5@m.co","Kevin0@m.co"],["Ethan","Ethan5@m.co","Ethan4@m.co","Ethan0@m.co"],["Hanzo","Hanzo3@m.co","Hanzo1@m.co","Hanzo0@m.co"],["Fern","Fern5@m.co","Fern1@m.co","Fern0@m.co"]]',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    await waitFor(() => {
      expect(screen.getByText('All execution steps')).toBeInTheDocument()
    })

    expect(
      screen.queryByText(/Must be a JSON 2D array of strings/)
    ).not.toBeInTheDocument()
  })
})
