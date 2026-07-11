/** Error information detected during compilation. */
export type CompilationError = {
  /** Line number where the error occurred. */
  line: number
  /** Column number where the error occurred. */
  column: number
  /** Detailed error message. */
  message: string
  /** Error severity. */
  severity: 'error' | 'warning'
}

/** Function parameter definition. */
export type FunctionParameter = {
  /** Parameter name. */
  name: string
  /** Parameter type, for example "number" or "string[]". */
  type: string
  /** Whether the parameter is optional. */
  optional: boolean
}

/** Class method signature extracted from a class-design solution. */
export type ClassMethodSignature = {
  /** Method name. */
  name: string
  /** Parameter list. */
  parameters: FunctionParameter[]
  /** Return type. */
  returnType: string
}

/** Function signature information. */
export type FunctionSignature = {
  /** Kind of target being verified. */
  kind?: 'function' | 'class'
  /** Function name. */
  name: string
  /** Parameter list. */
  parameters: FunctionParameter[]
  /** Return type. */
  returnType: string
  /** Public methods callable during class verification. */
  methods?: ClassMethodSignature[]
}

/** Compilation result. */
export type CompilationResult = {
  /** Whether compilation succeeded. */
  success: boolean
  /** Compiled code, only present on success. */
  code?: string
  /** Compilation error list. */
  errors: CompilationError[]
  /** Detected function signature, only present on success. */
  signature?: FunctionSignature
}
