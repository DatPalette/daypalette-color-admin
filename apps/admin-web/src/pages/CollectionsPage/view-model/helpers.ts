import type {
  CollectionDto,
  CollectionUpdateDto,
  CollectionsDocumentDto,
} from '@/models/collections'

// 收敛 Collection 页面成员编排与选中态判断的页面私有纯函数，避免主 hook 混入细碎规则。

// 标记 Collection 页面允许直接改写的标量字段。
export type EditableScalarField =
  | 'coverPaletteId'
  | 'descriptionEn'
  | 'descriptionZh'
  | 'isPro'
  | 'nameEn'
  | 'nameZh'
  | 'releaseMode'
  | 'status'
  | 'themeType'

// 标记 Collection 页面按标签切换方式维护的数组字段。
export type EditableTagField = 'occasionTags' | 'paletteIds' | 'styleTags'

// 在成员变更后统一 coverPaletteId 与 paletteIds 的联动规则，避免封面脱离成员列表。
export function buildDraftWithPaletteIds(currentDraft: CollectionDto, nextPaletteIds: string[]): CollectionDto {
  const uniquePaletteIds = Array.from(new Set(nextPaletteIds))

  return {
    ...currentDraft,
    coverPaletteId: uniquePaletteIds.includes(currentDraft.coverPaletteId)
      ? currentDraft.coverPaletteId
      : (uniquePaletteIds[0] ?? ''),
    paletteIds: uniquePaletteIds,
  }
}

// 收敛合集成员排序规则，只处理单页编排场景的上移和下移。
export function movePaletteId(
  paletteIds: string[],
  paletteId: string,
  direction: 'up' | 'down',
): string[] {
  const currentIndex = paletteIds.indexOf(paletteId)

  if (currentIndex === -1) {
    return paletteIds
  }

  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

  if (nextIndex < 0 || nextIndex >= paletteIds.length) {
    return paletteIds
  }

  const nextPaletteIds = [...paletteIds]
  const [targetPaletteId] = nextPaletteIds.splice(currentIndex, 1)

  if (!targetPaletteId) {
    return paletteIds
  }

  nextPaletteIds.splice(nextIndex, 0, targetPaletteId)

  return nextPaletteIds
}

// 为当前选中 Collection 生成可安全编辑的深拷贝，避免草稿态污染列表源数据。
export function cloneCollection(item: CollectionDto | null): CollectionDto | null {
  if (!item) {
    return null
  }

  return {
    ...item,
    occasionTags: [...item.occasionTags],
    paletteIds: [...item.paletteIds],
    styleTags: [...item.styleTags],
  }
}

// 按当前选中 id 回落到首项，统一 Collection 页的默认选中规则。
export function findSelectedCollection(
  collectionDocument: CollectionsDocumentDto | null,
  selectedCollectionId: string | null,
): CollectionDto | null {
  if (!collectionDocument) {
    return null
  }

  return (
    collectionDocument.items.find((item) => item.id === selectedCollectionId) ??
    collectionDocument.items[0] ??
    null
  )
}

// 从完整合集文档中过滤已归档项，服务恢复区块。
export function getArchivedCollections(collectionDocument: CollectionsDocumentDto | null): CollectionDto[] {
  if (!collectionDocument) {
    return []
  }

  return collectionDocument.items.filter((item) => item.status === 'deleted')
}

// 收敛更新接口不接收的运行时字段，供保存流程复用。
export function toUpdatePayload(draft: CollectionDto): CollectionUpdateDto {
  const { deleteReason, deletedAt, id, previousStatus, ...payload } = draft

  return payload
}

// 统一合集列表刷新后的选中项回退规则，优先命中当前 id，否则回落首项。
export function findSelectedCollectionId(
  collectionDocument: CollectionsDocumentDto,
  selectedCollectionId: string | null,
): string | null {
  return (
    collectionDocument.items.find((item) => item.id === selectedCollectionId)?.id ??
    collectionDocument.items[0]?.id ??
    null
  )
}