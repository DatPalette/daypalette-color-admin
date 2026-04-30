import type { ReactElement } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import type { DictionaryCardModel } from '@/models/dictionaries'

// 字典列表卡片，负责在列表区展示单本字典的作用域与条目摘要。
export function DictionaryCard({
  isSelected,
  model,
  onSelect,
}: {
  isSelected: boolean
  model: DictionaryCardModel
  onSelect: (key: string) => void
}): ReactElement {
  return (
    <button className="text-left" onClick={() => onSelect(model.key)} type="button">
      <Card
        className={[
          'h-full border transition-transform duration-300 hover:-translate-y-0.5',
          isSelected
            ? 'border-[var(--dp-fill-inverse)] bg-white'
            : 'border-[var(--dp-border-hairline)] bg-white/88',
        ].join(' ')}
      >
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{model.key}</p>
            <h3 className="mt-2 text-xl font-medium text-foreground">{model.labelZh}</h3>
            <p className="text-sm text-muted-foreground">{model.labelEn}</p>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <p>{model.scopeSummary}</p>
            <div className="flex items-center justify-between text-foreground">
              <span className="rounded-full bg-[var(--dp-bg-page)] px-2.5 py-1">{model.selectionModeLabel}</span>
              <span>{model.itemCountLabel}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}