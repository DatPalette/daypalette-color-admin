import type {
  PaletteCardModel,
  PaletteCollectionDto,
  PaletteDetailModel,
  PaletteDto,
  PaletteEditorOption,
  PaletteEditorOptions,
  PalettesPageModel,
} from '@/models/palettes'
import type { BaseColorCollectionDto } from '@/models/base-colors'
import type { CollectionsDocumentDto } from '@/models/collections'
import type { DictionariesDocumentDto, DictionaryNodeDto } from '@/models/dictionaries'
import { buildOptionLabelMap, resolveOptionLabel } from '@/utils/asset-display'
import { formatUpdatedAtLabel } from '@/utils/format-updated-at-label'

function buildBaseColorHexMap(baseColors?: BaseColorCollectionDto | null): Map<string, string> {
  return new Map((baseColors?.items ?? []).map((item) => [item.id, item.hex]))
}

function resolvePreviewHex(baseColorHexMap: Map<string, string>, colorId: string): string {
  return baseColorHexMap.get(colorId) ?? 'var(--dp-surface-high)'
}

// 把 Palette DTO 收敛成列表卡片模型，统一场景标签、状态和三色摘要展示。
function toPaletteCardModel(
  palette: PaletteDto,
  optionMaps: {
    baseColorLabelMap: Map<string, string>
    baseColorHexMap: Map<string, string>
    occasionLabelMap: Map<string, string>
    statusLabelMap: Map<string, string>
  },
): PaletteCardModel {
  return {
    id: palette.id,
    occasionLabel: resolveOptionLabel(optionMaps.occasionLabelMap, palette.occasionId),
    previewHexes: [palette.primaryColorId, palette.secondaryColorId, palette.accentColorId].map((colorId) =>
      resolvePreviewHex(optionMaps.baseColorHexMap, colorId),
    ),
    sourceCountLabel: `${palette.sourceCollectionIds.length} 个来源合集`,
    status: resolveOptionLabel(optionMaps.statusLabelMap, palette.status),
    trioSummary: [palette.primaryColorId, palette.secondaryColorId, palette.accentColorId]
      .map((colorId) => resolveOptionLabel(optionMaps.baseColorLabelMap, colorId))
      .join(' / '),
    slug: palette.slug,
  }
}

// 把当前选中 Palette DTO 收敛成详情面板模型，供编辑表单直接消费。
function toPaletteDetailModel(palette: PaletteDto | null): PaletteDetailModel | null {
  if (!palette) {
    return null
  }

  return {
    accentColorId: palette.accentColorId,
    archiveReason: palette.archiveReason,
    archivedAt: palette.archivedAt,
    fitPhotoScenario: palette.fitPhotoScenario,
    id: palette.id,
    isPro: palette.isPro,
    marketSignalSummary: palette.marketSignalSummary,
    moodTags: palette.moodTags,
    occasionId: palette.occasionId,
    primaryColorId: palette.primaryColorId,
    productionBatchId: palette.productionBatchId,
    referenceMethod: palette.referenceMethod,
    referenceSources: palette.referenceSources,
    reviewNotes: palette.reviewNotes,
    reviewStatus: palette.reviewStatus,
    reviewedAt: palette.reviewedAt,
    reviewer: palette.reviewer,
    safetyLevel: palette.safetyLevel,
    seasonTags: palette.seasonTags,
    secondaryColorId: palette.secondaryColorId,
    slug: palette.slug,
    sourceCollectionIds: palette.sourceCollectionIds,
    sourceType: palette.sourceType,
    status: palette.status,
    styleTags: palette.styleTags,
  }
}

// 把 Palette 集合 DTO 映射成页面列表、详情和统计信息。
export function toPalettesPageModel(
  collection: PaletteCollectionDto,
  selectedPaletteId: string | null,
  baseColors?: BaseColorCollectionDto | null,
  editorOptions?: PaletteEditorOptions | null,
): PalettesPageModel {
  const detailPalette = collection.items.find((item) => item.id === selectedPaletteId) ?? collection.items[0] ?? null
  const optionMaps = {
    baseColorLabelMap: buildOptionLabelMap(editorOptions?.baseColorOptions ?? []),
    baseColorHexMap: buildBaseColorHexMap(baseColors),
    occasionLabelMap: buildOptionLabelMap(editorOptions?.occasionOptions ?? []),
    statusLabelMap: buildOptionLabelMap(editorOptions?.statusOptions ?? []),
  }

  return {
    cards: collection.items.map((item) => toPaletteCardModel(item, optionMaps)),
    detail: toPaletteDetailModel(detailPalette),
    totalLabel: `${collection.items.length} 组配色盘`,
    updatedAtLabel: formatUpdatedAtLabel(collection.updatedAt),
  }
}

// 把字典节点折叠成 Palette 编辑器可消费的选项结构，并过滤已删除项。
function toDictionaryOptions(dictionary: DictionaryNodeDto | undefined): PaletteEditorOption[] {
  if (!dictionary) {
    return []
  }

  return dictionary.items
    .filter((item) => !item.isDeleted)
    .map((item) => ({
      label: item.labelZh,
      value: item.id,
    }))
}

// 把基础色、合集和字典数据映射成 Palette 编辑器所需的全部候选项。
export function toPaletteEditorOptions(
  baseColors: BaseColorCollectionDto,
  collections: CollectionsDocumentDto,
  dictionaries: DictionariesDocumentDto,
): PaletteEditorOptions {
  return {
    baseColorOptions: baseColors.items.map((item) => ({
      label: `${item.nameZh} (${item.id})`,
      value: item.id,
    })),
    moodTagOptions: toDictionaryOptions(dictionaries.dictionaries.moodTag),
    occasionOptions: toDictionaryOptions(dictionaries.dictionaries.occasion),
    referenceChannelTypeOptions: [
      { label: '未设置', value: '' },
      { label: '品牌官网', value: 'brand-site' },
      { label: '品牌旗舰店', value: 'brand-flagship-store' },
      { label: '多品牌平台', value: 'multi-brand-platform' },
      { label: '平台品牌店', value: 'marketplace-brand-store' },
    ],
    referenceMethodOptions: [
      { label: '未设置', value: '' },
      { label: '市场采样', value: 'market-sampled' },
      { label: '编辑推导', value: 'editorial-derived' },
      { label: '内部重组', value: 'internal-recomposition' },
    ],
    reviewStatusOptions: [
      { label: '未设置', value: '' },
      { label: '待审核', value: 'pending' },
      { label: '需修改', value: 'needsRevision' },
      { label: '已通过', value: 'approved' },
      { label: '已拒绝', value: 'rejected' },
    ],
    seasonTagOptions: toDictionaryOptions(dictionaries.dictionaries.seasonTag),
    sourceCollectionOptions: collections.items.map((item) => ({
      label: `${item.nameZh} (${item.id})`,
      value: item.id,
    })),
    statusOptions: toDictionaryOptions(dictionaries.dictionaries.status).filter(
      (item) => item.value !== 'deleted',
    ),
    styleTagOptions: toDictionaryOptions(dictionaries.dictionaries.styleTag),
  }
}