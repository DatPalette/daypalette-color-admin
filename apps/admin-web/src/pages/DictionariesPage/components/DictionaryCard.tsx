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
          'h-full border border-[var(--dp-border-subtle)] bg-white p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_-4px_rgba(26,26,26,0.04)]',
          isSelected
            ? 'border-[var(--dp-fill-inverse)] shadow-[0_8px_32px_-4px_rgba(26,26,26,0.06)]'
            : '',
        ].join(' ')}
      >
        <CardContent className="space-y-5 p-5">
          <div>
            <p className="label-caps text-muted-foreground">{model.key}</p>
            <h3 className="mt-3 text-[1.8rem] font-medium leading-none tracking-[-0.03em] text-foreground">{model.labelZh}</h3>
            <p className="mt-2 text-base text-muted-foreground">{model.labelEn}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-[var(--dp-border-subtle)] pt-4">
            <div>
              <p className="label-caps text-muted-foreground">Scope</p>
              <p className="mt-2 text-sm text-foreground">{model.scopeSummary}</p>
            </div>
            <div>
              <p className="label-caps text-muted-foreground">Mode</p>
              <p className="mt-2 text-sm text-foreground">{model.selectionModeLabel}</p>
            </div>
          </div>

          <div className="border-t border-[var(--dp-border-subtle)] pt-4 text-sm text-muted-foreground">{model.itemCountLabel}</div>
        </CardContent>
      </Card>
    </button>
  )
}