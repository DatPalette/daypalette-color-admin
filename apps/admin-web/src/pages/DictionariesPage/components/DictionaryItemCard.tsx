import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import type { DictionaryItemDto } from '@/models/dictionaries'

interface DictionaryItemCardProps {
  item: DictionaryItemDto
  onDelete: (itemId: string) => void
  onEdit: (itemId: string) => void
}

export function DictionaryItemCard({ item, onDelete, onEdit }: DictionaryItemCardProps): ReactElement {
  return (
    <div className="paper-card flex h-full flex-col bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label-caps text-[var(--dp-text-muted)]">{item.id}</p>
          <h3 className="mt-3 truncate text-lg font-semibold text-foreground">{item.labelZh}</h3>
          <p className="mt-1 truncate text-sm text-[var(--dp-text-muted)]">{item.labelEn}</p>
        </div>

        <span className="shrink-0 border border-[var(--dp-border-subtle)] px-2.5 py-1 label-caps text-[var(--dp-text-muted)]">
          {item.isActive ? '启用中' : '已停用'}
        </span>
      </div>

      <div className="mt-5 grid gap-4 border-t border-[var(--dp-border-subtle)] pt-4 sm:grid-cols-2">
        <div>
          <p className="label-caps text-[var(--dp-text-muted)]">Sort Order</p>
          <p className="mt-2 text-sm text-foreground">{item.sortOrder}</p>
        </div>
        <div>
          <p className="label-caps text-[var(--dp-text-muted)]">Aliases</p>
          <p className="mt-2 text-sm text-foreground">{item.aliases?.length ? item.aliases.join(' / ') : '无'}</p>
        </div>
      </div>

      {item.descriptionZh || item.descriptionEn ? (
        <p className="mt-4 border-t border-[var(--dp-border-subtle)] pt-4 text-sm leading-6 text-[var(--dp-text-muted)]">
          {item.descriptionZh || item.descriptionEn}
        </p>
      ) : null}

      <div className="mt-auto flex items-center gap-3 border-t border-[var(--dp-border-subtle)] pt-4">
        <Button className="flex-1" onClick={() => onEdit(item.id)} variant="outline">
          编辑
        </Button>
        <Button className="flex-1 border-red-300 text-red-700 hover:bg-red-50" onClick={() => onDelete(item.id)} variant="outline">
          删除
        </Button>
      </div>
    </div>
  )
}