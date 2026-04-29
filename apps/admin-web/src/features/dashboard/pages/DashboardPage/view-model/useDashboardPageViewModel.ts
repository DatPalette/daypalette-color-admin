import { useEffect, useState } from 'react'

import type { DashboardPageModel } from '@/features/dashboard/models/dashboard'
import { getDashboardOverview } from '@/features/dashboard/services/dashboard.service'
import { toDashboardPageModel } from '@/features/dashboard/transformers/dashboard.transformer'

interface DashboardPageViewModel {
  errorMessage: string | null
  isLoading: boolean
  model: DashboardPageModel | null
  onRefresh: () => Promise<void>
}

export function useDashboardPageViewModel(): DashboardPageViewModel {
  const [model, setModel] = useState<DashboardPageModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    void onRefresh()
  }, [])

  async function onRefresh(): Promise<void> {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const overview = await getDashboardOverview()
      setModel(toDashboardPageModel(overview))
    } catch {
      setErrorMessage('初始化管理台概览失败，请稍后再试。')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    errorMessage,
    isLoading,
    model,
    onRefresh,
  }
}