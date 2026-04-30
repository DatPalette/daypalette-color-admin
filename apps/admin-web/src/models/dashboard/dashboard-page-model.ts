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