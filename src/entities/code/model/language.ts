/** Currently supported source languages. */
export const SUPPORTED_LANGUAGES = ['typescript'] as const

/** Default language used by the editor and execution pipeline. */
export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0]

/** Identifier for a supported source language. */
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]
