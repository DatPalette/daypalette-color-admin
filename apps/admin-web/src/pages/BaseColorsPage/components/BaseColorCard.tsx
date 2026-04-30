import type { ReactElement } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import type { BaseColorCardModel } from '@/models/base-colors'

interface BaseColorCardProps {
  isSelected: boolean
  model: BaseColorCardModel
  onSelect: (id: string) => void
}

// 基础色列表卡片，负责在列表区展示单个基础色的视觉样本与摘要信息。
export function BaseColorCard({
  isSelected,
  model,
  onSelect,
}: BaseColorCardProps): ReactElement {
  return (
    <button className="text-left" onClick={() => onSelect(model.id)} type="button">
      <Card
        className={[
          'h-full overflow-hidden border transition-transform duration-300 hover:-translate-y-0.5',
          isSelected
            ? 'border-[var(--dp-fill-inverse)] bg-white'
            : 'border-[var(--dp-border-hairline)] bg-white/88',
        ].join(' ')}
      >
        <div className="h-28 w-full" style={{ backgroundColor: model.hex }} />
        <CardContent className="space-y-3 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{model.id}</p>
            <h3 className="mt-2 text-lg font-medium text-foreground">{model.nameZh}</h3>
            <p className="text-sm text-muted-foreground">{model.nameEn}</p>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <p>{model.hex}</p>
            <p>{model.tagSummary}</p>
            <div className="flex items-center justify-between text-foreground">
              <span className="rounded-full bg-[var(--dp-bg-page)] px-2.5 py-1">{model.colorFamily}</span>
              <span className="text-muted-foreground">{model.status}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}