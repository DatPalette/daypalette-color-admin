import type { ReactElement } from 'react'

import { cn } from '@/utils/cn'
import type { DictionaryCardModel } from '@/models/dictionaries'
import { getDictionarySelectionModeLabel, shouldShowEnglishLabel } from '../display'

interface DictionaryTabCardProps {
  isActive: boolean
  model: DictionaryCardModel
  onSelect: (key: string) => void
}

export function DictionaryTabCard({ isActive, model, onSelect }: DictionaryTabCardProps): ReactElement {
  return (
    <button
      className={cn(
        'paper-card min-w-[168px] px-3.5 py-3 text-left transition-colors duration-200',
        isActive ? 'border-[var(--dp-fill-inverse)] bg-[var(--dp-surface-soft)]' : 'hover:bg-[var(--dp-surface-soft)]',
      )}
      onClick={() => onSelect(model.key)}
      type="button"
    >
      <p className="truncate text-[15px] font-semibold text-foreground">{model.labelZh}</p>
      {shouldShowEnglishLabel(model.key, model.labelEn) ? (
        <p className="mt-0.5 truncate text-[13px] text-[var(--dp-text-muted)]">{model.labelEn}</p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--dp-text-muted)]">
        <span>{model.itemCountLabel}</span>
        <span>{getDictionarySelectionModeLabel(model.selectionModeLabel)}</span>
      </div>
    </button>
  )
}