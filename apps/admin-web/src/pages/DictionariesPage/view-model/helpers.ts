import type {
  DictionariesDocumentDto,
  DictionaryItemCreateDto,
  DictionaryItemDto,
  DictionaryNodeDto,
} from '@/models/dictionaries'

// 深拷贝单个字典条目，避免数组字段在草稿态和原始集合之间共享引用。
function cloneDictionaryItem(item: DictionaryItemDto): DictionaryItemDto {
  return {
    ...item,
    aliases: item.aliases ? [...item.aliases] : [],
    appliesTo: item.appliesTo ? [...item.appliesTo] : undefined,
  }
}

// 收敛字典页面的页面私有纯函数，负责选中态回退、草稿深拷贝和新增默认值生成。

// 为当前选中字典生成可编辑草稿，统一复制字段映射、作用域和条目数组。
export function cloneDictionaryNode(dictionary: DictionaryNodeDto | null): DictionaryNodeDto | null {
  if (!dictionary) {
    return null
  }

  return {
    ...dictionary,
    entityScopes: [...dictionary.entityScopes],
    fieldMappings: dictionary.fieldMappings.map((fieldMapping) => ({ ...fieldMapping })),
    items: dictionary.items.map(cloneDictionaryItem),
  }
}

// 按当前 key 定位字典，并在 key 无效时回落到首本字典。
export function findSelectedDictionary(
  collection: DictionariesDocumentDto | null,
  selectedKey: string,
): DictionaryNodeDto | null {
  if (!collection) {
    return null
  }

  return collection.dictionaries[selectedKey] ?? Object.values(collection.dictionaries)[0] ?? null
}

// 为当前字典筛出已归档条目，服务条目恢复区块。
export function getArchivedDictionaryItems(
  collection: DictionariesDocumentDto | null,
  selectedKey: string,
): DictionaryItemDto[] {
  if (!collection) {
    return []
  }

  return (collection.dictionaries[selectedKey]?.items ?? []).filter((item) => item.isDeleted)
}

// 基于当前字典内容生成新增条目草稿，并统一下一个排序值的默认策略。
export function buildNewDictionaryItemDraft(dictionary: DictionaryNodeDto | null): DictionaryItemCreateDto {
  const nextSortOrder =
    (dictionary?.items.reduce((maxSortOrder, item) => Math.max(maxSortOrder, item.sortOrder), 0) ?? 0) + 10

  return {
    aliases: [],
    appliesTo: undefined,
    descriptionEn: '',
    descriptionZh: '',
    id: '',
    isActive: true,
    labelEn: '',
    labelZh: '',
    sortOrder: nextSortOrder,
  }
}