export const DEFAULT_DICTIONARY_KEY = 'occasion'

export const workbenchPaths = {
  baseColors: '/base-colors',
  colorCollection: '/color-collection',
  collections: '/collections',
  dictionaries: (dictionaryKey = DEFAULT_DICTIONARY_KEY): string => `/dictionaries/${dictionaryKey}`,
  dictionariesRoot: '/dictionaries',
  palettes: '/palettes',
  samplingBatches: '/sampling-batches',
} as const

export interface WorkbenchNavigationItem {
  description: string
  label: string
  to: string
}

export const navigationItems: WorkbenchNavigationItem[] = [
  {
    label: '基础数据',
    description: '统一维护所有基础数据字典与受控词汇',
    to: workbenchPaths.dictionariesRoot,
  },
  {
    label: '基础色',
    description: '管理基础色卡与引用关系',
    to: workbenchPaths.baseColors,
  },
  {
    label: '配色盘',
    description: '查看三色配色盘的真实列表与详情',
    to: workbenchPaths.palettes,
  },
  {
    label: '采样助手',
    description: '查看采样批次、来源完整度与白名单覆盖',
    to: workbenchPaths.samplingBatches,
  },
  {
    label: '色彩采集',
    description: 'LLM 批量生成配色候选与图片取色',
    to: workbenchPaths.colorCollection,
  },
  {
    label: '合集',
    description: '维护合集、封面与成员顺序',
    to: workbenchPaths.collections,
  },
]