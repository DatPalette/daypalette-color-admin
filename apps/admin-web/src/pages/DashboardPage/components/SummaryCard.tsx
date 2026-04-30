import type { ReactElement } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardSummaryCardModel } from '@/models/dashboard'

const toneClassNameMap: Record<DashboardSummaryCardModel['tone'], string> = {
  accent: 'bg-[linear-gradient(180deg,rgba(232,216,211,0.75),rgba(255,255,255,0.92))]',
  ink: 'bg-[linear-gradient(180deg,rgba(93,99,122,0.12),rgba(255,255,255,0.94))]',
  paper: 'bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,248,246,0.92))]',
}

// 概览页摘要卡片，负责展示单项统计值与对应说明文案。
export function SummaryCard({ model }: { model: DashboardSummaryCardModel }): ReactElement {
  return (
    <Card className={toneClassNameMap[model.tone]}>
      <CardHeader className="pb-3">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{model.eyebrow}</p>
        <CardTitle>{model.value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{model.hint}</p>
      </CardContent>
    </Card>
  )
}