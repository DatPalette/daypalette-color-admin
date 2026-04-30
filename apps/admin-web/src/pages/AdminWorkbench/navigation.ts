export const DEFAULT_DICTIONARY_KEY = 'occasion'

export const workbenchPaths = {
  baseColors: '/base-colors',
  collections: '/collections',
  dictionaries: (dictionaryKey = DEFAULT_DICTIONARY_KEY): string => `/dictionaries/${dictionaryKey}`,
  palettes: '/palettes',
} as const

export interface WorkbenchNavigationItem {
  description: string
  label: string
  to: string
}

export interface WorkbenchNavigationSection {
  items: WorkbenchNavigationItem[]
  title: string
}

export const navigationSections: WorkbenchNavigationSection[] = [
  {
    title: '基础数据',
    items: [
      {
        label: '场合管理',
        description: '维护单选与多选的场合口径',
        to: workbenchPaths.dictionaries('occasion'),
      },
      {
        label: '风格标签管理',
        description: '统一风格标签与别名',
        to: workbenchPaths.dictionaries('styleTag'),
      },
      {
        label: '状态管理',
        description: '沉淀生命周期和软删除状态',
        to: workbenchPaths.dictionaries('status'),
      },
    ],
  },
  {
    title: '集合数据',
    items: [
      { label: 'Base Colors', description: '管理基础色卡与引用关系', to: workbenchPaths.baseColors },
      { label: 'Palettes', description: '查看三色配色盘的真实列表与详情', to: workbenchPaths.palettes },
      { label: 'Collections', description: '维护合集、封面与成员顺序', to: workbenchPaths.collections },
    ],
  },
]