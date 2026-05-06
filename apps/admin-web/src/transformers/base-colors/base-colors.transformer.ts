import type {
  BaseColorCardModel,
  BaseColorCollectionDto,
  BaseColorDetailModel,
  BaseColorDictionaryDto,
  BaseColorEditorDictionariesDto,
  BaseColorEditorOption,
  BaseColorEditorOptions,
  BaseColorsPageModel,
} from '@/models/base-colors'
import { buildOptionLabelMap, resolveOptionLabel } from '@/utils/asset-display'
import { formatUpdatedAtLabel } from '@/utils/format-updated-at-label'

// 把基础色 DTO 收敛为列表卡片所需字段，避免页面重复拼展示摘要。
function toBaseColorCardModel(
  item: BaseColorCollectionDto['items'][number],
  optionMaps: {
    colorFamilyLabelMap: Map<string, string>
    lightnessLevelLabelMap: Map<string, string>
    saturationLevelLabelMap: Map<string, string>
    statusLabelMap: Map<string, string>
    toneLabelMap: Map<string, string>
  },
): BaseColorCardModel {
  const tagSummary = [
    resolveOptionLabel(optionMaps.toneLabelMap, item.tone),
    resolveOptionLabel(optionMaps.lightnessLevelLabelMap, item.lightnessLevel),
    resolveOptionLabel(optionMaps.saturationLevelLabelMap, item.saturationLevel),
  ].join(' / ')

  return {
    colorFamily: resolveOptionLabel(optionMaps.colorFamilyLabelMap, item.colorFamily),
    hex: item.hex,
    id: item.id,
    nameEn: item.nameEn,
    nameZh: item.nameZh,
    status: resolveOptionLabel(optionMaps.statusLabelMap, item.status),
    tagSummary,
  }
}

// 把当前选中的基础色 DTO 收敛为详情面板模型，统一 mood summary 等展示字段。
function toBaseColorDetailModel(
  item: BaseColorCollectionDto['items'][number] | null,
  optionMaps: {
    colorFamilyLabelMap: Map<string, string>
    lightnessLevelLabelMap: Map<string, string>
    saturationLevelLabelMap: Map<string, string>
    statusLabelMap: Map<string, string>
    toneLabelMap: Map<string, string>
  },
): BaseColorDetailModel | null {
  if (!item) {
    return null
  }

  return {
    colorFamily: resolveOptionLabel(optionMaps.colorFamilyLabelMap, item.colorFamily),
    hex: item.hex,
    id: item.id,
    isNeutralCore: item.isNeutralCore,
    lightnessLevel: resolveOptionLabel(optionMaps.lightnessLevelLabelMap, item.lightnessLevel),
    moodSummary: [
      resolveOptionLabel(optionMaps.toneLabelMap, item.tone),
      resolveOptionLabel(optionMaps.colorFamilyLabelMap, item.colorFamily),
      resolveOptionLabel(optionMaps.statusLabelMap, item.status),
    ].join(' · '),
    nameEn: item.nameEn,
    nameZh: item.nameZh,
    occasionTags: item.occasionTags,
    saturationLevel: resolveOptionLabel(optionMaps.saturationLevelLabelMap, item.saturationLevel),
    seasonTags: item.seasonTags,
    status: resolveOptionLabel(optionMaps.statusLabelMap, item.status),
    styleTags: item.styleTags,
    tone: resolveOptionLabel(optionMaps.toneLabelMap, item.tone),
  }
}

// 把基础色编辑依赖的字典节点折叠成下拉/多选控件可消费的选项结构。
function toEditorOptions(dictionary: BaseColorDictionaryDto): BaseColorEditorOption[] {
  return dictionary.items
    .filter((item) => !item.isDeleted)
    .map((item) => ({
      label: item.labelZh,
      value: item.id,
    }))
}

// 把基础色集合 DTO 映射成页面列表与详情共用的展示模型。
export function toBaseColorsPageModel(
  collection: BaseColorCollectionDto,
  selectedId: string | null,
  editorOptions?: BaseColorEditorOptions | null,
): BaseColorsPageModel {
  const selectedItem = collection.items.find((item) => item.id === selectedId) ?? collection.items[0] ?? null
  const optionMaps = {
    colorFamilyLabelMap: buildOptionLabelMap(editorOptions?.colorFamilies ?? []),
    lightnessLevelLabelMap: buildOptionLabelMap(editorOptions?.lightnessLevels ?? []),
    saturationLevelLabelMap: buildOptionLabelMap(editorOptions?.saturationLevels ?? []),
    statusLabelMap: buildOptionLabelMap(editorOptions?.statuses ?? []),
    toneLabelMap: buildOptionLabelMap(editorOptions?.tones ?? []),
  }

  return {
    cards: collection.items.map((item) => toBaseColorCardModel(item, optionMaps)),
    detail: toBaseColorDetailModel(selectedItem, optionMaps),
    totalLabel: `${collection.items.length} 个基础色`,
    updatedAtLabel: formatUpdatedAtLabel(collection.updatedAt),
  }
}

// 把基础色编辑相关字典映射成编辑器选项，统一删除态过滤和标签显示字段。
export function toBaseColorEditorOptions(
  dictionaries: BaseColorEditorDictionariesDto,
): BaseColorEditorOptions {
  return {
    colorFamilies: toEditorOptions(dictionaries.dictionaries.colorFamily),
    lightnessLevels: toEditorOptions(dictionaries.dictionaries.lightnessLevel),
    occasionTags: toEditorOptions(dictionaries.dictionaries.occasion),
    saturationLevels: toEditorOptions(dictionaries.dictionaries.saturationLevel),
    seasonTags: toEditorOptions(dictionaries.dictionaries.seasonTag),
    statuses: toEditorOptions(dictionaries.dictionaries.status).filter(
      (item) => item.value !== 'deleted',
    ),
    styleTags: toEditorOptions(dictionaries.dictionaries.styleTag),
    tones: toEditorOptions(dictionaries.dictionaries.tone),
  }
}