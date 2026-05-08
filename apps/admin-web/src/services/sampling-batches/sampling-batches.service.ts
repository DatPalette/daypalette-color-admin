import type { SamplingBatchStatus } from '@daypalette-color-admin/contracts'

import type {
  SamplingBatchCollectionDto,
  SamplingBatchDto,
  SamplingCandidateGenerationCapabilitiesDto,
} from '@/models/sampling-batches'
import { buildApiErrorMessage, resolveAdminApiBaseUrl } from '@/api/admin-api'

export interface GenerateSamplingBatchCandidatesPayload {
  audience?: 'mixed' | 'womenswear'
  mode?: 'hybrid' | 'model-only' | 'rules-only'
  overwriteExisting?: boolean
  resetExisting?: boolean
  targetCount?: number
}

export async function getSamplingBatchCollection(): Promise<SamplingBatchCollectionDto> {
  const requestUrl = new URL('/api/sampling-batches', resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to load sampling batches: ${response.status}`))
  }

  return (await response.json()) as SamplingBatchCollectionDto
}

export async function getSamplingBatchCapabilities(): Promise<SamplingCandidateGenerationCapabilitiesDto> {
  const requestUrl = new URL('/api/sampling-batches/capabilities', resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to load sampling capabilities: ${response.status}`))
  }

  return (await response.json()) as SamplingCandidateGenerationCapabilitiesDto
}

export async function updateSamplingBatch(
  id: string,
  payload: SamplingBatchDto,
): Promise<SamplingBatchDto> {
  const requestUrl = new URL(`/api/sampling-batches/${encodeURIComponent(id)}`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to update sampling batch: ${response.status}`))
  }

  return (await response.json()) as SamplingBatchDto
}

export async function generateSamplingBatchCandidates(
  id: string,
  payload: GenerateSamplingBatchCandidatesPayload,
): Promise<SamplingBatchDto> {
  const requestUrl = new URL(`/api/sampling-batches/${encodeURIComponent(id)}/generate-candidates`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(
      await buildApiErrorMessage(response, `Failed to generate sampling candidates: ${response.status}`),
    )
  }

  return (await response.json()) as SamplingBatchDto
}

export async function updateSamplingBatchStatus(
  id: string,
  status: SamplingBatchStatus,
): Promise<SamplingBatchDto> {
  const requestUrl = new URL(`/api/sampling-batches/${encodeURIComponent(id)}/status`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    throw new Error(
      await buildApiErrorMessage(response, `Failed to update sampling batch status: ${response.status}`),
    )
  }

  return (await response.json()) as SamplingBatchDto
}

export async function deleteSamplingBatch(id: string): Promise<SamplingBatchCollectionDto> {
  const requestUrl = new URL(`/api/sampling-batches/${encodeURIComponent(id)}`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to delete sampling batch: ${response.status}`))
  }

  return (await response.json()) as SamplingBatchCollectionDto
}