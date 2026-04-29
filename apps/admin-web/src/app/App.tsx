import type { ReactElement } from 'react'

import { AppShell } from '@/app/AppShell'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'

export function App(): ReactElement {
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  )
}