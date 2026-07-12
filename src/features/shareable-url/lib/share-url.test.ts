import { describe, expect, it } from 'vite-plus/test'

import { decodeShareState } from './share-state-codec'
import {
  createShareUrl,
  readExampleFromUrl,
  readShareStateFromUrl,
} from './share-url'

const examples = [
  {
    id: 'two-sum',
    sourceCode: 'function twoSum() { return [] }',
    defaultInputValues: { nums: '[2,7]', target: 9 },
  },
]

const location = {
  origin: 'https://dsa.example',
  pathname: '/',
}

describe('share URL helpers', () => {
  it('uses a readable URL for unchanged built-in examples', async () => {
    await expect(
      createShareUrl({ v: 1, e: 'two-sum' }, location, examples)
    ).resolves.toEqual({
      success: true,
      url: 'https://dsa.example/?example=two-sum',
    })
  })

  it('encodes custom state in the fragment', async () => {
    const result = await createShareUrl(
      {
        v: 1,
        c: 'function custom(accounts: string[][]) { return accounts }',
        i: { accounts: '[["John","john@mail.com"]]' },
        m: 'verification',
      },
      location,
      examples
    )

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.url).toMatch(/^https:\/\/dsa\.example\/#s=/)

    const encoded = new URL(result.url).hash.slice('#s='.length)
    const decoded = await decodeShareState(encoded)

    expect(decoded).toMatchObject({
      success: true,
      state: {
        c: 'function custom(accounts: string[][]) { return accounts }',
        i: { accounts: '[["John","john@mail.com"]]' },
      },
    })
  })

  it('can force built-in examples into tokenized share URLs', async () => {
    const result = await createShareUrl(
      { v: 1, e: 'two-sum' },
      location,
      examples,
      { format: 'token' }
    )

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.url).toMatch(/^https:\/\/dsa\.example\/#s=/)

    const encoded = new URL(result.url).hash.slice('#s='.length)
    await expect(decodeShareState(encoded)).resolves.toMatchObject({
      success: true,
      state: { e: 'two-sum' },
    })
  })

  it('reads example query parameters', () => {
    expect(
      readExampleFromUrl({ search: '?example=two-sum' }, examples)
    ).toEqual(examples[0])
    expect(readExampleFromUrl({ search: '?example=missing' }, examples)).toBe(
      null
    )
  })

  it('reads encoded state from the URL fragment', async () => {
    const result = await createShareUrl(
      { v: 1, e: 'two-sum', i: { target: 9 } },
      location,
      examples
    )

    expect(result.success).toBe(true)
    if (!result.success) return

    await expect(
      readShareStateFromUrl({ hash: new URL(result.url).hash })
    ).resolves.toMatchObject({
      success: true,
      state: { e: 'two-sum', i: { target: 9 } },
    })
  })
})
