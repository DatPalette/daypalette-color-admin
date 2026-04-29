export interface DashboardOverviewDto {
  baseColors: number
  collections: number
  dictionaries: number
  dictionaryValues: number
  lastSyncedAt: string
  palettes: number
}

export interface DashboardSummaryCardModel {
  eyebrow: string
  hint: string
  tone: 'accent' | 'ink' | 'paper'
  value: string
}

export interface DashboardActionPanelModel {
  description: string
  items: string[]
  title: string
}

export interface DashboardPageModel {
  actionPanels: DashboardActionPanelModel[]
  lastSyncedLabel: string
  summaryCards: DashboardSummaryCardModel[]
}