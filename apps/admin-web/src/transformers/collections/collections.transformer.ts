import type {
  CollectionCardModel,
  CollectionDetailModel,
  CollectionEditorOption,
  CollectionEditorOptions,
  CollectionsDocumentDto,
  CollectionsPageModel,
} from '@/models/collections'
import type { DictionariesDocumentDto, DictionaryNodeDto } from '@/models/dictionaries'
import type { BaseColorCollectionDto } from '@/models/base-colors'
import type { PaletteCollectionDto } from '@/models/palettes'
import { buildOptionLabelMap, resolveOptionLabel } from '@/utils/asset-display'
import { formatUpdatedAtLabel } from '@/utils/format-updated-at-label'

// 为合集页面建立 paletteId 到 slug 的索引，供列表和详情区复用展示名回退规则。
function buildPaletteSlugMap(palettes: PaletteCollectionDto): Map<string, string> {
  return new Map(palettes.items.map((palette) => [palette.id, palette.slug]))
}

// 把 paletteId 收敛成优先展示 slug、兜底展示原始 id 的文案规则。
function resolvePaletteSlug(paletteSlugMap: Map<string, string>, paletteId: string): string {
  return paletteSlugMap.get(paletteId) ?? paletteId
}

function buildBaseColorHexMap(baseColors?: BaseColorCollectionDto | null): Map<string, string> {
  return new Map((baseColors?.items ?? []).map((item) => [item.id, item.hex]))
}

function buildPalettePreviewMap(
  palettes: PaletteCollectionDto,
  baseColorHexMap: Map<string, string>,
): Map<string, string[]> {
  return new Map(
    palettes.items.map((palette) => [
      palette.id,
      [palette.primaryColorId, palette.secondaryColorId, palette.accentColorId].map(
        (colorId) => baseColorHexMap.get(colorId) ?? 'var(--dp-surface-high)',
      ),
    ]),
  )
}

// 把合集 DTO 收敛成列表卡片模型，统一封面、状态和主题类型的展示字段。
function toCollectionCardModel(
  collection: CollectionsDocumentDto['items'][number],
  paletteSlugMap: Map<string, string>,
  palettePreviewMap: Map<string, string[]>,
  optionMaps: {
    statusLabelMap: Map<string, string>
    themeTypeLabelMap: Map<string, string>
  },
): CollectionCardModel {
  return {
    coverPaletteSlug: resolvePaletteSlug(paletteSlugMap, collection.coverPaletteId),
    coverPreviewHexes: palettePreviewMap.get(collection.coverPaletteId) ?? [
      'var(--dp-surface-high)',
      'var(--dp-palette-secondary)',
      'var(--dp-palette-accent)',
    ],
    id: collection.id,
    nameEn: collection.nameEn,
    nameZh: collection.nameZh,
    paletteCountLabel: `${collection.paletteIds.length} 组配色盘`,
    status: resolveOptionLabel(optionMaps.statusLabelMap, collection.status),
    themeType: resolveOptionLabel(optionMaps.themeTypeLabelMap, collection.themeType),
  }
}

// 把当前选中合集 DTO 收敛成详情面板模型，统一 palette slug 与封面信息。
function toCollectionDetailModel(
  collection: CollectionsDocumentDto['items'][number] | null,
  paletteSlugMap: Map<string, string>,
): CollectionDetailModel | null {
  if (!collection) {
    return null
  }

  return {
    coverPaletteId: collection.coverPaletteId,
    coverPaletteSlug: resolvePaletteSlug(paletteSlugMap, collection.coverPaletteId),
    descriptionEn: collection.descriptionEn,
    descriptionZh: collection.descriptionZh,
    id: collection.id,
    isPro: collection.isPro,
    nameEn: collection.nameEn,
    nameZh: collection.nameZh,
    occasionTags: collection.occasionTags,
    paletteIds: collection.paletteIds,
    paletteSlugs: collection.paletteIds.map((paletteId) => resolvePaletteSlug(paletteSlugMap, paletteId)),
    releaseMode: collection.releaseMode,
    status: collection.status,
    styleTags: collection.styleTags,
    themeType: collection.themeType,
  }
}

// 把合集文档与 Palette 集合映射成页面列表、详情和统计信息。
export function toCollectionsPageModel(
  collectionDocument: CollectionsDocumentDto,
  paletteCollection: PaletteCollectionDto,
  selectedCollectionId: string | null,
  baseColors?: BaseColorCollectionDto | null,
  editorOptions?: CollectionEditorOptions | null,
): CollectionsPageModel {
  const paletteSlugMap = buildPaletteSlugMap(paletteCollection)
  const palettePreviewMap = buildPalettePreviewMap(paletteCollection, buildBaseColorHexMap(baseColors))
  const optionMaps = {
    statusLabelMap: buildOptionLabelMap(editorOptions?.statusOptions ?? []),
    themeTypeLabelMap: buildOptionLabelMap(editorOptions?.themeTypeOptions ?? []),
  }
  const detailCollection =
    collectionDocument.items.find((item) => item.id === selectedCollectionId) ??
    collectionDocument.items[0] ??
    null

  return {
    cards: collectionDocument.items.map((item) =>
      toCollectionCardModel(item, paletteSlugMap, palettePreviewMap, optionMaps),
    ),
    detail: toCollectionDetailModel(detailCollection, paletteSlugMap),
    totalLabel: `${collectionDocument.items.length} 本合集`,
    updatedAtLabel: formatUpdatedAtLabel(collectionDocument.updatedAt),
  }
}

// 把字典节点折叠成合集编辑器可消费的选项结构，并过滤已删除项。
function toDictionaryOptions(dictionary: DictionaryNodeDto | undefined): CollectionEditorOption[] {
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

// 把 Palette 与字典数据映射成合集编辑器的所有候选项。
export function toCollectionEditorOptions(
  palettes: PaletteCollectionDto,
  dictionaries: DictionariesDocumentDto,
): CollectionEditorOptions {
  return {
    occasionOptions: toDictionaryOptions(dictionaries.dictionaries.occasion),
    paletteOptions: palettes.items.map((item) => ({
      label: `${item.slug} (${item.id})`,
      value: item.id,
    })),
    releaseModeOptions: toDictionaryOptions(dictionaries.dictionaries.releaseMode),
    statusOptions: toDictionaryOptions(dictionaries.dictionaries.status).filter(
      (item) => item.value !== 'deleted',
    ),
    styleTagOptions: toDictionaryOptions(dictionaries.dictionaries.styleTag),
    themeTypeOptions: toDictionaryOptions(dictionaries.dictionaries.themeType),
  }
}