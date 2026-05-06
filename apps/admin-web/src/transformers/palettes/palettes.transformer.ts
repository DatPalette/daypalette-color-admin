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
import { formatUpdatedAtLabel } from '@/utils/format-updated-at-label'

// 为编辑器选项建立 value 到 label 的索引，供列表与详情统一做展示名回退。
function buildOptionLabelMap(options: PaletteEditorOption[]): Map<string, string> {
  return new Map(options.map((option) => [option.value, option.label]))
}

// 按统一回退策略把枚举值解析成展示文案。
function resolveOptionLabel(optionLabelMap: Map<string, string>, value: string): string {
  return optionLabelMap.get(value) ?? value
}

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
    fitPhotoScenario: palette.fitPhotoScenario,
    id: palette.id,
    isPro: palette.isPro,
    moodTags: palette.moodTags,
    occasionId: palette.occasionId,
    primaryColorId: palette.primaryColorId,
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