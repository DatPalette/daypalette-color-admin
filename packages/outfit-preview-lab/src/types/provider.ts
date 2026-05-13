import type { ProviderName } from './job.js'

export interface GeneratedImage {
  remoteUrl?: string
  b64Json?: string
  size?: string
  format?: string
}

export interface ProviderRunOptions {
  waitForCompletion: boolean
  timeoutMs: number
  pollIntervalMs: number
}

export interface ProviderExecutionResult {
  provider: ProviderName
  status: 'submitted' | 'completed' | 'failed'
  requestBody: unknown
  submitResponse: unknown
  finalResponse?: unknown
  requestId?: string
  taskId?: string
  images: GeneratedImage[]
  usage?: Record<string, unknown>
  warnings?: string[]
  errorMessage?: string
}