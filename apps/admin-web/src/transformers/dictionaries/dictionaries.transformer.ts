import type {
  DictionariesDocumentDto,
  DictionaryCardModel,
  DictionariesPageModel,
} from '@/models/dictionaries'
import { formatUpdatedAtLabel } from '@/utils/format-updated-at-label'

// 把单本字典 DTO 收敛成列表卡片模型，统一展示条目数、作用域和选择模式摘要。
function toDictionaryCardModel(
  key: string,
  dictionary: DictionariesDocumentDto['dictionaries'][string],
): DictionaryCardModel {
  return {
    itemCountLabel: `${dictionary.items.length} 项`,
    key,
    labelEn: dictionary.labelEn,
    labelZh: dictionary.labelZh,
    scopeSummary: dictionary.entityScopes.join(' / '),
    selectionModeLabel: dictionary.selectionMode,
  }
}

// 把整本文档字典集合映射成字典列表页模型。
export function toDictionariesPageModel(collection: DictionariesDocumentDto): DictionariesPageModel {
  return {
    cards: Object.entries(collection.dictionaries).map(([key, dictionary]) =>
      toDictionaryCardModel(key, dictionary),
    ),
    totalLabel: `${Object.keys(collection.dictionaries).length} 本字典`,
    updatedAtLabel: formatUpdatedAtLabel(collection.updatedAt),
  }
}