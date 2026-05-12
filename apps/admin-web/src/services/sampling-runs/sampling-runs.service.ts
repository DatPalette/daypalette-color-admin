import type {
  LlmBatchGenerateParams,
  SamplingRunOperationType,
} from '@daypalette-color-admin/contracts'

import type {
  SamplingRunDto,
  SamplingRunEventDto,
} from '@/models/sampling-runs'
import { buildApiErrorMessage, resolveAdminApiBaseUrl } from '@/api/admin-api'

export interface CreateSamplingRunPayload {
  batchId?: string
  llmBatchGenerate?: LlmBatchGenerateParams
  operationType?: SamplingRunOperationType
}

interface SamplingRunStreamHandlers {
  onError: (error: unknown) => void
  onEvent: (event: SamplingRunEventDto) => void
}

const samplingRunStreamEventTypes: SamplingRunEventDto['type'][] = [
  'run-created',
  'stage-started',
  'candidate-link-found',
  'page-opened',
  'page-skipped',
  'auth-required',
  'manual-evidence-requested',
  'screenshot-captured',
  'image-selected',
  'colors-extracted',
  'cluster-created',
  'cluster-merged',
  'model-analysis-started',
  'model-analysis-finished',
  'llm-generation-started',
  'llm-record-generated',
  'llm-generation-finished',
  'warning',
  'error',
  'run-finished',
]

function parseSamplingRunEvent(data: string): SamplingRunEventDto {
  return JSON.parse(data) as SamplingRunEventDto
}

export async function createSamplingRun(payload: CreateSamplingRunPayload): Promise<SamplingRunDto> {
  const requestUrl = new URL('/api/sampling-runs', resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to create sampling run: ${response.status}`))
  }

  return (await response.json()) as SamplingRunDto
}

export async function getSamplingRun(id: string): Promise<SamplingRunDto> {
  const requestUrl = new URL(`/api/sampling-runs/${encodeURIComponent(id)}`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to load sampling run: ${response.status}`))
  }

  return (await response.json()) as SamplingRunDto
}

export function subscribeToSamplingRunStream(
  id: string,
  handlers: SamplingRunStreamHandlers,
): EventSource {
  const requestUrl = new URL(`/api/sampling-runs/${encodeURIComponent(id)}/stream`, resolveAdminApiBaseUrl())
  const eventSource = new EventSource(requestUrl)

  const handleMessage = (event: MessageEvent<string>) => {
    try {
      handlers.onEvent(parseSamplingRunEvent(event.data))
    } catch (error) {
      handlers.onError(error)
    }
  }

  eventSource.onmessage = handleMessage

  for (const eventType of samplingRunStreamEventTypes) {
    eventSource.addEventListener(eventType, (event) => {
      if (event instanceof MessageEvent) {
        handleMessage(event as MessageEvent<string>)
      }
    })
  }

  eventSource.onerror = (error) => {
    handlers.onError(error)
  }

  return eventSource
}