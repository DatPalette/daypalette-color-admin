import type { ReactElement } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import type { CollectionCardModel } from '@/models/collections'

// Collection 列表卡片，负责在列表区展示单本合集的摘要信息与选中态。
export function CollectionCard({
  isSelected,
  model,
  onSelect,
}: {
  isSelected: boolean
  model: CollectionCardModel
  onSelect: (id: string) => void
}): ReactElement {
  const defaultCoverColors = ['#e5d6cf', '#d3c3bb', '#aa9b94', '#7d6f68']
  const coverPresets: string[][] = [
    defaultCoverColors,
    ['#f2ecdf', '#ddd1b5', '#c9b896', '#9f8c60'],
    ['#e3e8ee', '#cbd8e7', '#a8bdd2', '#6b8aa0'],
  ]
  const coverColors = coverPresets[model.id.charCodeAt(0) % coverPresets.length] ?? defaultCoverColors

  return (
    <button className="block w-full text-left" onClick={() => onSelect(model.id)} type="button">
      <Card
        className={[
          'min-h-[180px] overflow-hidden border border-[var(--dp-border-subtle)] bg-white p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_-4px_rgba(26,26,26,0.04)]',
          isSelected
            ? 'border-[var(--dp-fill-inverse)] shadow-[0_8px_32px_-4px_rgba(26,26,26,0.06)]'
            : '',
        ].join(' ')}
      >
        <CardContent className="grid gap-4 p-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
          <div className="grid grid-cols-4 overflow-hidden border border-black/5">
            {coverColors.map((color) => (
              <div key={color} className="h-20" style={{ backgroundColor: color }} />
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[2rem] font-medium leading-none tracking-[-0.03em] text-foreground">{model.nameZh}</h3>
                <p className="mt-2 text-lg text-muted-foreground">{model.nameEn}</p>
              </div>
              <span className="label-caps bg-[var(--dp-surface-soft)] px-2.5 py-1 text-muted-foreground">{model.status}</span>
            </div>

            <div className="grid gap-4 border-t border-[var(--dp-border-subtle)] pt-4 md:grid-cols-3">
              <div>
                <p className="label-caps text-muted-foreground">Theme</p>
                <p className="mt-2 text-sm text-foreground">{model.themeType}</p>
              </div>
              <div>
                <p className="label-caps text-muted-foreground">Cover Palette</p>
                <p className="mt-2 text-sm text-foreground">{model.coverPaletteSlug}</p>
              </div>
              <div>
                <p className="label-caps text-muted-foreground">Members</p>
                <p className="mt-2 text-sm text-foreground">{model.paletteCountLabel}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}