import type { ReactElement } from 'react'

import { cn } from '@/utils/cn'
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
    <button className="block h-full w-full text-left" onClick={() => onSelect(model.id)} type="button">
      <div
        className={cn(
          'paper-card h-full overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_-4px_rgba(26,26,26,0.04)]',
          isSelected && 'border-[var(--dp-fill-inverse)] shadow-[0_8px_32px_-4px_rgba(26,26,26,0.08)]',
        )}
      >
        <div className="aspect-[4/3] border-b border-[var(--dp-border-subtle)]" style={{ backgroundColor: model.hex }} />

        <div className="space-y-5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="label-caps text-[var(--dp-text-muted)]">{model.id}</p>
              <h3 className="display-font mt-3 truncate text-[2rem] leading-none tracking-[-0.03em] text-foreground">
                {model.nameZh}
              </h3>
              <p className="mt-2 truncate text-sm text-[var(--dp-text-muted)]">{model.nameEn}</p>
            </div>
            <div className="shrink-0 border border-[var(--dp-border-subtle)] px-3 py-1.5 label-caps text-[var(--dp-text-muted)]">
              {model.hex}
            </div>
          </div>

          <div className="grid gap-4 border-t border-[var(--dp-border-subtle)] pt-4 sm:grid-cols-2">
            <div>
              <p className="label-caps text-[var(--dp-text-muted)]">Family</p>
              <p className="mt-2 text-sm text-foreground">{model.colorFamily}</p>
            </div>
            <div>
              <p className="label-caps text-[var(--dp-text-muted)]">Profile</p>
              <p className="mt-2 text-sm text-foreground">{model.tagSummary}</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--dp-border-subtle)] pt-4 text-sm">
            <span className="text-[var(--dp-text-muted)]">{model.status}</span>
            <span className="label-caps text-foreground">Edit</span>
          </div>
        </div>
      </div>
    </button>
  )
}