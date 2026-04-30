import type {
  DashboardOverviewDto,
  DashboardPageModel,
} from '@/models/dashboard'
import {
  buildActionPanels,
  buildLastSyncedLabel,
  buildSummaryCards,
} from './dashboard.helpers'

// 把概览 DTO 映射成首页页面模型，统一摘要卡片、动作面板和最后同步时间展示。
export function toDashboardPageModel(dto: DashboardOverviewDto): DashboardPageModel {
  return {
    actionPanels: buildActionPanels(),
    lastSyncedLabel: buildLastSyncedLabel(dto.lastSyncedAt),
    summaryCards: buildSummaryCards(dto),
  }
}