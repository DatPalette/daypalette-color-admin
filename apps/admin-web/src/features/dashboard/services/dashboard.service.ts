import { dashboardOverviewSeed } from '@/features/dashboard/constants/dashboard.constants'
import type { DashboardOverviewDto } from '@/features/dashboard/models/dashboard'

export async function getDashboardOverview(): Promise<DashboardOverviewDto> {
  return dashboardOverviewSeed
}