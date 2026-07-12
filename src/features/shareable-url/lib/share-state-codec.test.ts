import { describe, expect, it } from 'vite-plus/test'

import { decodeShareState, encodeShareState } from './share-state-codec'
import {
  SHARE_DECOMPRESSED_BYTES_MAX_LENGTH,
  SHARE_ENCODED_TOKEN_MAX_LENGTH,
} from './share-state-limits'

describe('share state codec', () => {
  it('round-trips custom source and raw inputs', async () => {
    const encoded = await encodeShareState({
      v: 1,
      l: 'typescript',
      c: `function hello(name: string): string {
  return \`Hello \${name}\`
}`,
      i: { name: 'world' },
      m: 'verification',
    })

    expect(encoded).toMatch(/^[cj]\.[A-Za-z0-9_-]+$/)
    expect(encoded).not.toContain('=')

    const decoded = await decodeShareState(encoded)

    expect(decoded).toEqual({
      success: true,
      state: {
        v: 1,
        l: 'typescript',
        c: `function hello(name: string): string {
  return \`Hello \${name}\`
}`,
        i: { name: 'world' },
        m: 'verification',
      },
    })
  })

  it('rejects malformed payloads', async () => {
    await expect(decodeShareState('x.not-valid')).resolves.toEqual({
      success: false,
      reason: 'invalid-encoding',
    })
  })

  it('rejects encoded tokens before decoding when they exceed the URL limit', async () => {
    const oversizedToken = `j.${'a'.repeat(SHARE_ENCODED_TOKEN_MAX_LENGTH - 1)}`

    await expect(decodeShareState(oversizedToken)).resolves.toEqual({
      success: false,
      reason: 'too-large',
    })
  })

  it('stops decoding compressed payloads that exceed the stream limit', async () => {
    const encoded = await encodeShareState({
      v: 1,
      c: 'x'.repeat(SHARE_DECOMPRESSED_BYTES_MAX_LENGTH + 1),
    })

    expect(encoded).toMatch(/^c\./)
    expect(encoded.length).toBeLessThan(SHARE_ENCODED_TOKEN_MAX_LENGTH)
    await expect(decodeShareState(encoded)).resolves.toEqual({
      success: false,
      reason: 'too-large',
    })
  })

  it('rejects unsupported versions', async () => {
    const encoded = await encodeShareState({
      v: 1,
      e: 'two-sum',
    })
    const decoded = await decodeShareState(encoded)

    expect(decoded.success).toBe(true)

    const future = await encodeShareState({
      v: 2 as 1,
      e: 'two-sum',
    })

    await expect(decodeShareState(future)).resolves.toEqual({
      success: false,
      reason: 'unsupported-version',
    })
  })
})
