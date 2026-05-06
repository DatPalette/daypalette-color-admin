import type { ReactElement } from 'react'

import { cn } from '@/utils/cn'
import type { DictionaryCardModel } from '@/models/dictionaries'

interface DictionaryTabCardProps {
  isActive: boolean
  model: DictionaryCardModel
  onSelect: (key: string) => void
}

export function DictionaryTabCard({ isActive, model, onSelect }: DictionaryTabCardProps): ReactElement {
  return (
    <button
      className={cn(
        'paper-card min-w-[196px] px-4 py-4 text-left transition-colors duration-200',
        isActive ? 'border-[var(--dp-fill-inverse)] bg-[var(--dp-surface-soft)]' : 'hover:bg-[var(--dp-surface-soft)]',
      )}
      onClick={() => onSelect(model.key)}
      type="button"
    >
      <p className="truncate text-base font-semibold text-foreground">{model.labelZh}</p>
      <p className="mt-1 truncate text-sm text-[var(--dp-text-muted)]">{model.labelEn}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[var(--dp-text-muted)]">
        <span>{model.itemCountLabel}</span>
        <span>{model.selectionModeLabel}</span>
      </div>
    </button>
  )
}