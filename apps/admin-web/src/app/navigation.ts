export interface NavigationItem {
  description: string
  isActive?: boolean
  label: string
}

export interface NavigationSection {
  items: NavigationItem[]
  title: string
}

export const navigationSections: NavigationSection[] = [
  {
    title: '基础数据',
    items: [
      { label: '场合管理', description: '维护单选与多选的场合口径' },
      { label: '风格标签管理', description: '统一风格标签与别名' },
      { label: '状态管理', description: '沉淀生命周期和软删除状态' },
    ],
  },
  {
    title: '集合数据',
    items: [
      { label: 'Base Colors', description: '管理基础色卡与引用关系' },
      { label: 'Palettes', description: '管理三色配色盘', isActive: true },
      { label: 'Collections', description: '维护合集、封面与成员顺序' },
    ],
  },
]