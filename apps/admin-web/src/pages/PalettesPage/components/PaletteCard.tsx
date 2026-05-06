import type { ReactElement } from 'react'

import { cn } from '@/utils/cn'
import type { PaletteCardModel } from '@/models/palettes'

// Palette 列表卡片，负责在列表区展示单个 Palette 的摘要信息与选中态。
export function PaletteCard({
  isSelected,
  model,
  onSelect,
}: {
  isSelected: boolean
  model: PaletteCardModel
  onSelect: (id: string) => void
}): ReactElement {
  return (
    <button className="block w-full text-left" onClick={() => onSelect(model.id)} type="button">
      <div
        className={cn(
          'paper-card min-h-[260px] overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_-4px_rgba(26,26,26,0.04)]',
          isSelected && 'border-[var(--dp-fill-inverse)] shadow-[0_8px_32px_-4px_rgba(26,26,26,0.08)]',
        )}
      >
        <div className="grid grid-cols-3 border-b border-[var(--dp-border-subtle)]">
          {model.previewHexes.map((color, index) => (
            <div key={`${model.id}-${index}`} className="h-28" style={{ backgroundColor: color }} />
          ))}
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="label-caps text-[var(--dp-text-muted)]">{model.id}</p>
              <h3 className="display-font mt-3 truncate text-[1.9rem] leading-none tracking-[-0.03em] text-foreground">
                {model.slug}
              </h3>
              <p className="mt-2 text-sm text-[var(--dp-text-muted)]">{model.occasionLabel}</p>
            </div>
            <div className="shrink-0 border border-[var(--dp-border-subtle)] px-3 py-1.5 label-caps text-[var(--dp-text-muted)]">
              {model.status}
            </div>
          </div>

          <div className="grid gap-4 border-t border-[var(--dp-border-subtle)] pt-4 sm:grid-cols-2">
            <div>
              <p className="label-caps text-[var(--dp-text-muted)]">来源合集</p>
              <p className="mt-2 text-sm text-foreground">{model.sourceCountLabel}</p>
            </div>
            <div>
              <p className="label-caps text-[var(--dp-text-muted)]">三色预览</p>
              <p className="mt-2 text-sm text-foreground">{model.trioSummary}</p>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}