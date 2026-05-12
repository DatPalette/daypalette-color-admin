export const DEFAULT_DICTIONARY_KEY = 'occasion'

export const workbenchPaths = {
  baseColors: '/base-colors',
  collections: '/collections',
  dictionaries: (dictionaryKey = DEFAULT_DICTIONARY_KEY): string => `/dictionaries/${dictionaryKey}`,
  dictionariesRoot: '/dictionaries',
  palettes: '/palettes',
  samplingWorkbench: '/sampling-workbench',
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
    label: '采样工作台',
    description: 'LLM 生成配色候选、图片取色与批次审阅',
    to: workbenchPaths.samplingWorkbench,
  },
  {
    label: '合集',
    description: '维护合集、封面与成员顺序',
    to: workbenchPaths.collections,
  },
]