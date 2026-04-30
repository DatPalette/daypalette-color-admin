import type { ReactElement } from 'react'
import { RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ActionPanel } from './components/ActionPanel'
import { SummaryCard } from './components/SummaryCard'
import { useDashboardPageViewModel } from './view-model/useDashboardPageViewModel'

// 管理台概览页，负责承接后台首页的摘要卡片与下一步动作提示。
export function DashboardPage(): ReactElement {
  const { errorMessage, isLoading, model, onRefresh } = useDashboardPageViewModel()

  return (
    <div className="space-y-6 lg:space-y-8">
      <Card className="overflow-hidden border-[var(--dp-border-hairline)] bg-[linear-gradient(140deg,rgba(255,255,255,0.96),rgba(232,216,211,0.56))]">
        <CardContent className="grid gap-6 p-6 md:p-8 xl:grid-cols-[minmax(0,1.3fr)_280px] xl:items-end">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Workbench Overview</p>
            <div className="space-y-3">
              <h2 className="display-font max-w-[12ch] text-5xl leading-none tracking-[-0.05em] text-foreground md:text-6xl">
                配色资产后台已经起好第一层骨架。
              </h2>
              <p className="max-w-[58ch] text-sm leading-7 text-muted-foreground md:text-base">
                当前首页先承接信息架构、页面骨架和共享设计语言。后续你可以直接在这个壳层上继续接列表页、详情抽屉和文件回写流程。
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-[28px] border border-white/80 bg-white/70 p-5 backdrop-blur-md">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Last Sync</p>
              <p className="text-lg font-medium text-foreground">
                {model?.lastSyncedLabel ?? '正在准备初始数据'}
              </p>
            </div>
            <Button className="w-full" onClick={() => void onRefresh()} variant="primary">
              <RefreshCcw className="size-4" />
              刷新概览
            </Button>
          </div>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Card className="border-red-200 bg-red-50/80 text-red-700">
          <CardContent className="p-5 text-sm leading-6">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {(model?.summaryCards ?? []).map((card) => (
          <SummaryCard key={card.eyebrow} model={card} />
        ))}
        {isLoading && !model
          ? Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="min-h-[180px] animate-pulse bg-white/60" />
            ))
          : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {(model?.actionPanels ?? []).map((panel) => (
          <ActionPanel key={panel.title} model={panel} />
        ))}
      </section>
    </div>
  )
}