import type { SamplingBatchStatus } from '@daypalette-color-admin/contracts'

import type {
  SamplingBatchCollectionDto,
  SamplingBatchDto,
} from '@/models/sampling-batches'
import { buildApiErrorMessage, resolveAdminApiBaseUrl } from '@/api/admin-api'

export async function getSamplingBatchCollection(): Promise<SamplingBatchCollectionDto> {
  const requestUrl = new URL('/api/sampling-batches', resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to load sampling batches: ${response.status}`))
  }

  return (await response.json()) as SamplingBatchCollectionDto
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