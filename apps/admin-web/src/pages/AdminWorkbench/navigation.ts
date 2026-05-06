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
        label: '季节标签管理',
        description: '维护季节标签集合',
        to: workbenchPaths.dictionaries('seasonTag'),
      },
      {
        label: '心情标签管理',
        description: '维护情绪标签集合',
        to: workbenchPaths.dictionaries('moodTag'),
      },
      {
        label: '色系管理',
        description: '维护基础色色系',
        to: workbenchPaths.dictionaries('colorFamily'),
      },
      {
        label: '冷暖管理',
        description: '维护冷暖属性',
        to: workbenchPaths.dictionaries('tone'),
      },
      {
        label: '明度等级管理',
        description: '维护明度枚举',
        to: workbenchPaths.dictionaries('lightnessLevel'),
      },
      {
        label: '饱和度等级管理',
        description: '维护饱和度枚举',
        to: workbenchPaths.dictionaries('saturationLevel'),
      },
      {
        label: '安全等级管理',
        description: '维护配色安全等级',
        to: workbenchPaths.dictionaries('safetyLevel'),
      },
      {
        label: '集合主题管理',
        description: '维护合集主题类型',
        to: workbenchPaths.dictionaries('themeType'),
      },
      {
        label: '发布模式管理',
        description: '维护合集发布模式',
        to: workbenchPaths.dictionaries('releaseMode'),
      },
      {
        label: '来源类型管理',
        description: '维护配色来源类型',
        to: workbenchPaths.dictionaries('sourceType'),
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