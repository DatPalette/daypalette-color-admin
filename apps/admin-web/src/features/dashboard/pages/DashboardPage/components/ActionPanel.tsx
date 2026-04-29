import type { ReactElement } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardActionPanelModel } from '@/features/dashboard/models/dashboard'

export function ActionPanel({ model }: { model: DashboardActionPanelModel }): ReactElement {
  return (
    <Card className="border-[var(--dp-border-hairline)] bg-white/90">
      <CardHeader>
        <CardTitle className="text-2xl">{model.title}</CardTitle>
        <CardDescription className="leading-6">{model.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm leading-6 text-foreground">
          {model.items.map((item) => (
            <li key={item} className="rounded-[18px] border border-border bg-[var(--dp-bg-page)] px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}