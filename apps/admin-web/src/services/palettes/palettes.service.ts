import type {
  PaletteCreateDto,
  PaletteCollectionDto,
  PaletteDeleteCheckDto,
  PaletteDeleteDto,
  PaletteUpdateDto,
} from '@/models/palettes'
import { buildApiErrorMessage, resolveAdminApiBaseUrl } from '@/api/admin-api'

// 收敛 Palette 页面与 admin-api 之间的请求协议，统一错误转换和 URL 组装细节。

// 读取 Palette 集合，供列表区和归档恢复区按需切换是否带回已删除项。
export async function getPalettesCollection(options?: {
  includeDeleted?: boolean
}): Promise<PaletteCollectionDto> {
  const requestUrl = new URL('/api/palettes', resolveAdminApiBaseUrl())

  if (options?.includeDeleted) {
    requestUrl.searchParams.set('includeDeleted', 'true')
  }

  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to load palettes: ${response.status}`))
  }

  return (await response.json()) as PaletteCollectionDto
}

// 提交新增 Palette 草稿，并返回最新集合供页面刷新选中态。
export async function createPalette(payload: PaletteCreateDto): Promise<PaletteCollectionDto> {
  const requestUrl = new URL('/api/palettes', resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to create palette: ${response.status}`))
  }

  return (await response.json()) as PaletteCollectionDto
}

// 提交 Palette 编辑草稿，并返回最新集合供详情区与列表同步。
export async function updatePalette(
  id: string,
  payload: PaletteUpdateDto,
): Promise<PaletteCollectionDto> {
  const requestUrl = new URL(`/api/palettes/${id}`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to update palette: ${response.status}`))
  }

  return (await response.json()) as PaletteCollectionDto
}

// 读取 Palette 删除前的引用检查结果，避免页面直接拼装 delete-check 协议。
export async function getPaletteDeleteCheck(id: string): Promise<PaletteDeleteCheckDto> {
  const requestUrl = new URL(`/api/palettes/${id}/delete-check`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error(
      await buildApiErrorMessage(response, `Failed to check palette delete risk: ${response.status}`),
    )
  }

  return (await response.json()) as PaletteDeleteCheckDto
}

// 提交 Palette 软删除请求，并返回最新集合供页面回退选中项。
export async function deletePalette(
  id: string,
  payload: PaletteDeleteDto,
): Promise<PaletteCollectionDto> {
  const requestUrl = new URL(`/api/palettes/${id}`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to delete palette: ${response.status}`))
  }

  return (await response.json()) as PaletteCollectionDto
}

// 恢复已归档 Palette，并返回最新集合供恢复区块和详情区同步。
export async function restorePalette(id: string): Promise<PaletteCollectionDto> {
  const requestUrl = new URL(`/api/palettes/${id}/restore`, resolveAdminApiBaseUrl())
  const response = await fetch(requestUrl, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(await buildApiErrorMessage(response, `Failed to restore palette: ${response.status}`))
  }

  return (await response.json()) as PaletteCollectionDto
}