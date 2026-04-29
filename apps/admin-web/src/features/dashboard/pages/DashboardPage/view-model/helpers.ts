import type {
  DashboardActionPanelModel,
  DashboardOverviewDto,
  DashboardSummaryCardModel,
} from '@/features/dashboard/models/dashboard'

export function buildLastSyncedLabel(lastSyncedAt: string): string {
  const date = new Date(lastSyncedAt)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`
}

export function buildSummaryCards(
  overview: DashboardOverviewDto,
): DashboardSummaryCardModel[] {
  return [
    {
      eyebrow: '基础数据',
      hint: `${overview.dictionaries} 个字典，${overview.dictionaryValues} 个候选值等待后台统一治理。`,
      tone: 'accent',
      value: `${overview.dictionaries}/${overview.dictionaryValues}`,
    },
    {
      eyebrow: '基础色与配色盘',
      hint: `${overview.baseColors} 个基础色已关联 ${overview.palettes} 组配色盘。`,
      tone: 'paper',
      value: `${overview.baseColors} / ${overview.palettes}`,
    },
    {
      eyebrow: '合集组织',
      hint: `${overview.collections} 个合集等待进入正式的增删改与排序流程。`,
      tone: 'ink',
      value: `${overview.collections} 组`,
    },
  ]
}

export function buildActionPanels(): DashboardActionPanelModel[] {
  return [
    {
      title: '当前项目已经就位',
      description: '前端与后端骨架已创建，接下来可以直接开始接数据合同和文件读写。',
      items: [
        '基础数据会单独沉淀为 dictionaries.v1.json。',
        '删除统一走软删除，并保留引用检查。',
        '左侧菜单已按基础数据 / 集合数据两大类固定。',
      ],
    },
    {
      title: '下一步推荐',
      description: '优先把假数据替换成真实的文件接口，再继续补 CRUD 页面。',
      items: [
        '先接通 dictionaries、base-colors、palettes、collections 的列表接口。',
        '再补详情抽屉与保存流程。',
        '最后接入删除前引用检查与软删除回写。',
      ],
    },
  ]
}