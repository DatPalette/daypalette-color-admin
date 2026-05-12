import type { ReactElement } from 'react'

import { cn } from '@/utils/cn'

import { getOutfitPreviewSlotLabel } from './outfit-preview.utils'
import type { OutfitPreviewColorToken, OutfitPreviewSlot } from './outfit-preview.types'

const legendSlots: OutfitPreviewSlot[] = ['main', 'secondary', 'accent']

export function OutfitPreviewLegend({
  className,
  colors,
}: {
  className?: string
  colors: Record<OutfitPreviewSlot, OutfitPreviewColorToken>
}): ReactElement {
  return (
    <div className={cn('grid gap-3 md:grid-cols-3', className)}>
      {legendSlots.map((slot) => {
        const token = colors[slot]

        return (
          <div
            key={slot}
            className="overflow-hidden rounded-[18px] border border-[var(--dp-border-subtle)] bg-white"
          >
            <div className="h-16" style={{ backgroundColor: token.hex }} />
            <div className="space-y-1 p-4">
              <p className="label-caps text-muted-foreground">{getOutfitPreviewSlotLabel(slot)}</p>
              <p className="text-sm font-semibold text-foreground">{token.label}</p>
              <p className="text-xs text-muted-foreground">{token.hex.toUpperCase()}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}