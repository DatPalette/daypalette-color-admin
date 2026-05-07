import type {
  PaletteCreateDto,
  PaletteCollectionDto,
  PaletteDto,
  PaletteEditorOptions,
  PaletteUpdateDto,
} from '@/models/palettes'

// 收敛 Palette 页面草稿编辑与选中态判断的页面私有纯函数，避免主 hook 混入细碎规则。

// 标记 Palette 页面允许直接改写的标量字段。
export type EditableScalarField =
  | 'accentColorId'
  | 'archiveReason'
  | 'archivedAt'
  | 'fitPhotoScenario'
  | 'id'
  | 'isPro'
  | 'marketSignalSummary'
  | 'occasionId'
  | 'primaryColorId'
  | 'productionBatchId'
  | 'referenceMethod'
  | 'reviewNotes'
  | 'reviewStatus'
  | 'reviewedAt'
  | 'reviewer'
  | 'safetyLevel'
  | 'secondaryColorId'
  | 'slug'
  | 'sourceType'
  | 'status'

export type EditableReferenceSourceField =
  | 'brandName'
  | 'channelType'
  | 'itemCategory'
  | 'notes'
  | 'observedAt'
  | 'platform'
  | 'sourceId'
  | 'sourceUrl'

// 标记 Palette 页面按标签切换方式维护的数组字段。
export type EditableTagField = 'moodTags' | 'seasonTags' | 'sourceCollectionIds' | 'styleTags'

// 为当前选中 Palette 生成可安全编辑的深拷贝，避免草稿态污染列表源数据。
export function clonePalette(item: PaletteDto | null): PaletteDto | null {
  if (!item) {
    return null
  }

  return {
    ...item,
    archiveReason: item.archiveReason ?? '',
    archivedAt: item.archivedAt ?? '',
    marketSignalSummary: item.marketSignalSummary ?? '',
    moodTags: [...item.moodTags],
    productionBatchId: item.productionBatchId ?? '',
    referenceMethod: item.referenceMethod ?? '',
    referenceSources: (item.referenceSources ?? []).map((source) => ({
      ...source,
      colorSummary: [...source.colorSummary],
    })),
    reviewNotes: item.reviewNotes ?? '',
    reviewStatus: item.reviewStatus ?? '',
    reviewedAt: item.reviewedAt ?? '',
    reviewer: item.reviewer ?? '',
    seasonTags: [...item.seasonTags],
    sourceCollectionIds: [...item.sourceCollectionIds],
    styleTags: [...item.styleTags],
  }
}

// 按当前选中 id 回落到首项，统一 Palette 页的默认选中规则。
export function findSelectedPalette(
  collection: PaletteCollectionDto | null,
  selectedPaletteId: string | null,
): PaletteDto | null {
  if (!collection) {
    return null
  }

  return collection.items.find((item) => item.id === selectedPaletteId) ?? collection.items[0] ?? null
}

// 从完整集合中过滤已归档 Palette，服务恢复区块。
export function getArchivedPalettes(collection: PaletteCollectionDto | null): PaletteDto[] {
  if (!collection) {
    return []
  }

  return collection.items.filter((item) => item.status === 'deleted')
}

// 收敛更新接口不接收的运行时字段，供保存流程复用。
export function toUpdatePayload(draft: PaletteDto): PaletteUpdateDto {
  const { deleteReason, deletedAt, id, previousStatus, ...payload } = draft

  return payload
}

// 基于编辑器选项生成新增 Palette 草稿，统一默认三色位和字段回退顺序。
export function buildNewPaletteDraft(editorOptions: PaletteEditorOptions): PaletteDto {
  const primaryColorId = editorOptions.baseColorOptions[0]?.value ?? ''
  const secondaryColorId = editorOptions.baseColorOptions[1]?.value ?? primaryColorId
  const accentColorId = editorOptions.baseColorOptions[2]?.value ?? secondaryColorId

  return {
    accentColorId,
    archiveReason: '',
    archivedAt: '',
    fitPhotoScenario: false,
    id: '',
    isPro: false,
    marketSignalSummary: '',
    moodTags: [],
    occasionId: editorOptions.occasionOptions[0]?.value ?? '',
    primaryColorId,
    productionBatchId: '',
    referenceMethod: 'market-sampled',
    referenceSources: [],
    reviewNotes: '',
    reviewStatus: 'pending',
    reviewedAt: '',
    reviewer: '',
    safetyLevel: 'safe',
    seasonTags: [],
    secondaryColorId,
    slug: '',
    sourceCollectionIds: [],
    sourceType: 'curated',
    status: editorOptions.statusOptions[0]?.value ?? 'approved',
    styleTags: [],
  }
}

// 收敛创建接口不接收的运行时字段，供新增流程复用。
export function toCreatePayload(draft: PaletteDto): PaletteCreateDto {
  const { deleteReason, deletedAt, previousStatus, ...payload } = draft

  return payload
}

// 统一 Palette 列表刷新后的选中项回退规则，优先命中当前 id，否则回落首项。
export function findSelectedPaletteId(
  collection: PaletteCollectionDto,
  selectedPaletteId: string | null,
): string | null {
  return collection.items.find((item) => item.id === selectedPaletteId)?.id ?? collection.items[0]?.id ?? null
}