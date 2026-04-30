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
  return (
    <button className="block w-full text-left" onClick={() => onSelect(model.id)} type="button">
      <Card
        className={[
          'min-h-[224px] overflow-hidden border transition-colors',
          isSelected
            ? 'border-transparent bg-[var(--dp-fill-inverse)] text-[var(--dp-text-on-inverse)] shadow-paper'
            : 'border-[var(--dp-border-hairline)] bg-white/80 hover:bg-white',
        ].join(' ')}
      >
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <p
              className={[
                'text-xs uppercase tracking-[0.24em]',
                isSelected ? 'text-white/70' : 'text-muted-foreground',
              ].join(' ')}
            >
              {model.id}
            </p>
            <h3 className="display-font text-3xl tracking-[-0.04em]">{model.nameZh}</h3>
            <p className={isSelected ? 'text-white/70' : 'text-muted-foreground'}>{model.nameEn}</p>
          </div>

          <div className="space-y-3 text-sm leading-6">
            <div>
              <p className={isSelected ? 'text-white/70' : 'text-muted-foreground'}>Theme</p>
              <p>{model.themeType}</p>
            </div>
            <div>
              <p className={isSelected ? 'text-white/70' : 'text-muted-foreground'}>Cover Palette</p>
              <p>{model.coverPaletteSlug}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span
                className={[
                  'rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]',
                  isSelected ? 'bg-white/15 text-white/80' : 'bg-[var(--dp-fill-soft)] text-muted-foreground',
                ].join(' ')}
              >
                {model.status}
              </span>
              <span className={isSelected ? 'text-white/70' : 'text-muted-foreground'}>
                {model.paletteCountLabel}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}