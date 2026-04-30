import type {
  DictionariesDocumentDto,
  DictionaryItemCreateDto,
  DictionaryItemDeleteCheckDto,
  DictionaryNodeDto,
} from '@/models/dictionaries'
import { buildApiErrorMessage, resolveAdminApiBaseUrl } from '@/api/admin-api'

// 收敛字典页面与 admin-api 之间的请求协议，统一 key/itemId 的 URL 编码和错误转换。

// 读取整本文档字典集合，供字典列表和条目恢复区按需切换是否带回已删除项。
export async function getDictionariesCollection(options?: {
  includeDeleted?: boolean
}): Promise<DictionariesDocumentDto> {
  const requestUrl = new URL('/api/dictionaries', resolveAdminApiBaseUrl())

  if (options?.includeDeleted) {
    requestUrl.searchParams.set('includeDeleted', 'true')
  }

  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to load dictionaries: ${response.status}`))
  }

  return (await response.json()) as DictionariesDocumentDto
}

// 向指定字典追加新条目，并返回最新字典文档供当前字典视图刷新。
export async function createDictionaryItem(
  key: string,
  payload: DictionaryItemCreateDto,
): Promise<DictionariesDocumentDto> {
  const requestUrl = new URL(`/api/dictionaries/${encodeURIComponent(key)}/items`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to create dictionary item: ${response.status}`))
  }

  return (await response.json()) as DictionariesDocumentDto
}

// 提交整本字典的编辑草稿，供字典标题、说明和条目顺序统一写回。
export async function updateDictionary(
  key: string,
  payload: DictionaryNodeDto,
): Promise<DictionariesDocumentDto> {
  const requestUrl = new URL(`/api/dictionaries/${key}`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to update dictionary: ${response.status}`))
  }

  return (await response.json()) as DictionariesDocumentDto
}

// 读取字典条目删除前的引用检查结果，供页面决定是否允许软删除。
export async function getDictionaryItemDeleteCheck(
  key: string,
  itemId: string,
): Promise<DictionaryItemDeleteCheckDto> {
  const requestUrl = new URL(
    `/api/dictionaries/${encodeURIComponent(key)}/items/${encodeURIComponent(itemId)}/delete-check`,
    resolveAdminApiBaseUrl(),
  )
  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error(
      await buildApiErrorMessage(response, `Failed to check dictionary item delete risk: ${response.status}`),
    )
  }

  return (await response.json()) as DictionaryItemDeleteCheckDto
}

// 提交字典条目软删除请求，并返回最新字典文档供当前字典详情区同步。
export async function deleteDictionaryItem(
  key: string,
  itemId: string,
  payload: { deleteReason?: string },
): Promise<DictionariesDocumentDto> {
  const requestUrl = new URL(
    `/api/dictionaries/${encodeURIComponent(key)}/items/${encodeURIComponent(itemId)}`,
    resolveAdminApiBaseUrl(),
  )
  const response = await fetch(requestUrl, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(
      await buildApiErrorMessage(response, `Failed to delete dictionary item: ${response.status}`),
    )
  }

  return (await response.json()) as DictionariesDocumentDto
}

// 恢复指定字典中的已归档条目，并返回最新文档供恢复区块同步。
export async function restoreDictionaryItem(
  key: string,
  itemId: string,
): Promise<DictionariesDocumentDto> {
  const requestUrl = new URL(
    `/api/dictionaries/${encodeURIComponent(key)}/items/${encodeURIComponent(itemId)}/restore`,
    resolveAdminApiBaseUrl(),
  )
  const response = await fetch(requestUrl, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(
      await buildApiErrorMessage(response, `Failed to restore dictionary item: ${response.status}`),
    )
  }

  return (await response.json()) as DictionariesDocumentDto
}