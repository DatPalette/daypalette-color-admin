import { dashboardOverviewSeed } from '@/constants/dashboard/dashboard.constants'
import type { DashboardOverviewDto } from '@/models/dashboard'

// 为概览页提供 overview DTO；当前先由本地 seed 承接，后续可无感替换成真实接口。
export async function getDashboardOverview(): Promise<DashboardOverviewDto> {
  return dashboardOverviewSeed
}