import type {
  BaseColorCreateDto,
  BaseColorCollectionDto,
  BaseColorDto,
  BaseColorEditorOptions,
  BaseColorUpdateDto,
} from '@/models/base-colors'

// 收敛基础色页面草稿编辑与选中态判断的页面私有纯函数，避免主 hook 混入细碎规则。

// 标记基础色页面允许直接改写的标量字段。
export type EditableScalarField =
  | 'colorFamily'
  | 'hex'
  | 'id'
  | 'isNeutralCore'
  | 'lightnessLevel'
  | 'nameEn'
  | 'nameZh'
  | 'saturationLevel'
  | 'status'
  | 'tone'

// 标记基础色页面按标签切换方式维护的数组字段。
export type EditableTagField = 'occasionTags' | 'seasonTags' | 'styleTags'

// 为当前选中基础色生成可安全编辑的深拷贝，避免草稿态污染列表源数据。
export function cloneBaseColor(item: BaseColorDto | null): BaseColorDto | null {
  if (!item) {
    return null
  }

  return {
    ...item,
    occasionTags: [...item.occasionTags],
    seasonTags: [...item.seasonTags],
    styleTags: [...item.styleTags],
  }
}

// 按当前选中 id 回落到首项，统一基础色页面的默认选中规则。
export function findSelectedBaseColor(
  collection: BaseColorCollectionDto | null,
  selectedId: string | null,
): BaseColorDto | null {
  if (!collection) {
    return null
  }

  return collection.items.find((item) => item.id === selectedId) ?? collection.items[0] ?? null
}

// 从完整集合中过滤已归档项，服务右侧恢复区块。
export function getArchivedBaseColors(collection: BaseColorCollectionDto | null): BaseColorDto[] {
  if (!collection) {
    return []
  }

  return collection.items.filter((item) => item.status === 'deleted')
}

// 基于编辑器选项生成新增草稿，统一初始默认值和首选项回退顺序。
export function buildNewBaseColorDraft(editorOptions: BaseColorEditorOptions): BaseColorDto {
  return {
    colorFamily: editorOptions.colorFamilies[0]?.value ?? '',
    hex: '#F4F1EA',
    id: '',
    isNeutralCore: false,
    lightnessLevel: editorOptions.lightnessLevels[0]?.value ?? '',
    nameEn: '',
    nameZh: '',
    occasionTags: [],
    saturationLevel: editorOptions.saturationLevels[0]?.value ?? '',
    seasonTags: [],
    status: editorOptions.statuses[0]?.value ?? 'approved',
    styleTags: [],
    tone: editorOptions.tones[0]?.value ?? '',
  }
}

// 收敛创建接口不接收的运行时字段，供新增流程复用。
export function toCreatePayload(draft: BaseColorDto): BaseColorCreateDto {
  const { deleteReason, deletedAt, previousStatus, ...payload } = draft

  return payload
}

// 收敛更新接口不接收的运行时字段，供保存流程复用。
export function toUpdatePayload(draft: BaseColorDto): BaseColorUpdateDto {
  const { deleteReason, deletedAt, id, previousStatus, ...payload } = draft

  return payload
}