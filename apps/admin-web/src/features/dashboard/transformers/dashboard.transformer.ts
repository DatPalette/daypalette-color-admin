import type {
  DashboardOverviewDto,
  DashboardPageModel,
} from '@/features/dashboard/models/dashboard'
import {
  buildActionPanels,
  buildLastSyncedLabel,
  buildSummaryCards,
} from '@/features/dashboard/pages/DashboardPage/view-model/helpers'

export function toDashboardPageModel(dto: DashboardOverviewDto): DashboardPageModel {
  return {
    actionPanels: buildActionPanels(),
    lastSyncedLabel: buildLastSyncedLabel(dto.lastSyncedAt),
    summaryCards: buildSummaryCards(dto),
  }
}