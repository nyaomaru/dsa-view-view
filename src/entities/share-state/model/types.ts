import type { AppMode } from '@/shared/model'

export type ShareStateMode = Extract<
  AppMode,
  'editor' | 'verification' | 'runtime'
>

export type ShareStateV1 = {
  v: 1
  l?: 'typescript'
  e?: string
  c?: string
  i?: Record<string, unknown>
  m?: ShareStateMode
  p?: number
}

export type ShareStateDecodeErrorReason =
  | 'invalid-encoding'
  | 'invalid-json'
  | 'invalid-state'
  | 'unsupported-version'
  | 'too-large'

export type ShareStateDecodeResult =
  | { success: true; state: ShareStateV1 }
  | { success: false; reason: ShareStateDecodeErrorReason }
