import type {
  CollectionDeleteCheckDto,
  CollectionDeleteDto,
  CollectionUpdateDto,
  CollectionsDocumentDto,
} from '@/models/collections'
import { buildApiErrorMessage, resolveAdminApiBaseUrl } from '@/api/admin-api'

// 收敛 Collection 页面与 admin-api 之间的请求协议，统一 URL 编码和错误转换细节。

// 读取合集文档，供列表区和归档恢复区按需切换是否带回已删除项。
export async function getCollectionsCollection(options?: {
  includeDeleted?: boolean
}): Promise<CollectionsDocumentDto> {
  const requestUrl = new URL('/api/collections', resolveAdminApiBaseUrl())

  if (options?.includeDeleted) {
    requestUrl.searchParams.set('includeDeleted', 'true')
  }

  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to load collections: ${response.status}`))
  }

  return (await response.json()) as CollectionsDocumentDto
}

// 提交合集编辑草稿，并返回最新文档供成员编排面板和列表同步。
export async function updateCollection(
  id: string,
  payload: CollectionUpdateDto,
): Promise<CollectionsDocumentDto> {
  const requestUrl = new URL(`/api/collections/${encodeURIComponent(id)}`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to update collection: ${response.status}`))
  }

  return (await response.json()) as CollectionsDocumentDto
}

// 读取合集删除前的引用检查结果，供页面决定是否允许软删除。
export async function getCollectionDeleteCheck(id: string): Promise<CollectionDeleteCheckDto> {
  const requestUrl = new URL(
    `/api/collections/${encodeURIComponent(id)}/delete-check`,
    resolveAdminApiBaseUrl(),
  )
  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error(
      await buildApiErrorMessage(response, `Failed to check collection delete risk: ${response.status}`),
    )
  }

  return (await response.json()) as CollectionDeleteCheckDto
}

// 提交合集软删除请求，并返回最新文档供页面回退选中项。
export async function deleteCollection(
  id: string,
  payload: CollectionDeleteDto,
): Promise<CollectionsDocumentDto> {
  const requestUrl = new URL(`/api/collections/${encodeURIComponent(id)}`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to delete collection: ${response.status}`))
  }

  return (await response.json()) as CollectionsDocumentDto
}

// 恢复已归档合集，并返回最新文档供恢复区块和详情区同步。
export async function restoreCollection(id: string): Promise<CollectionsDocumentDto> {
  const requestUrl = new URL(`/api/collections/${encodeURIComponent(id)}/restore`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to restore collection: ${response.status}`))
  }

  return (await response.json()) as CollectionsDocumentDto
}