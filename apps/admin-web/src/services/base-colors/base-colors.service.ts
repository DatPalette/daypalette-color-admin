import type {
  BaseColorCollectionDto,
  BaseColorCreateDto,
  BaseColorDeleteCheckDto,
  BaseColorDeleteDto,
  BaseColorEditorDictionariesDto,
  BaseColorUpdateDto,
} from '@/models/base-colors'
import { buildApiErrorMessage, resolveAdminApiBaseUrl } from '@/api/admin-api'

// 收敛基础色页面与 admin-api 之间的请求协议，统一错误转换和 URL 组装细节。

// 读取基础色集合，供列表区和归档恢复区按需切换是否带回已删除项。
export async function getBaseColorCollection(options?: {
  includeDeleted?: boolean
}): Promise<BaseColorCollectionDto> {
  const requestUrl = new URL('/api/base-colors', resolveAdminApiBaseUrl())

  if (options?.includeDeleted) {
    requestUrl.searchParams.set('includeDeleted', 'true')
  }

  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to load base colors: ${response.status}`))
  }

  return (await response.json()) as BaseColorCollectionDto
}

// 提交新增基础色草稿，并返回写回后的最新集合供页面刷新选中态。
export async function createBaseColor(payload: BaseColorCreateDto): Promise<BaseColorCollectionDto> {
  const requestUrl = new URL('/api/base-colors', resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to create base color: ${response.status}`))
  }

  return (await response.json()) as BaseColorCollectionDto
}

// 读取基础色编辑依赖的字典集合，供编辑器选项构建流程复用。
export async function getBaseColorEditorDictionaries(): Promise<BaseColorEditorDictionariesDto> {
  const requestUrl = new URL('/api/dictionaries', resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error(
      await buildApiErrorMessage(response, `Failed to load dictionaries: ${response.status}`),
    )
  }

  return (await response.json()) as BaseColorEditorDictionariesDto
}

// 提交基础色编辑草稿，并返回最新集合供详情区与列表同步。
export async function updateBaseColor(
  id: string,
  payload: BaseColorUpdateDto,
): Promise<BaseColorCollectionDto> {
  const requestUrl = new URL(`/api/base-colors/${id}`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to update base color: ${response.status}`))
  }

  return (await response.json()) as BaseColorCollectionDto
}

// 读取基础色删除前的引用检查结果，避免页面直接拼装 delete-check 协议。
export async function getBaseColorDeleteCheck(id: string): Promise<BaseColorDeleteCheckDto> {
  const requestUrl = new URL(`/api/base-colors/${id}/delete-check`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error(
      await buildApiErrorMessage(response, `Failed to check base color delete risk: ${response.status}`),
    )
  }

  return (await response.json()) as BaseColorDeleteCheckDto
}

// 提交基础色软删除请求，并返回最新集合供页面回退选中项。
export async function deleteBaseColor(
  id: string,
  payload: BaseColorDeleteDto,
): Promise<BaseColorCollectionDto> {
  const requestUrl = new URL(`/api/base-colors/${id}`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to delete base color: ${response.status}`))
  }

  return (await response.json()) as BaseColorCollectionDto
}

// 恢复已归档基础色，并返回最新集合供恢复区块和详情区同步。
export async function restoreBaseColor(id: string): Promise<BaseColorCollectionDto> {
  const requestUrl = new URL(`/api/base-colors/${id}/restore`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to restore base color: ${response.status}`))
  }

  return (await response.json()) as BaseColorCollectionDto
}