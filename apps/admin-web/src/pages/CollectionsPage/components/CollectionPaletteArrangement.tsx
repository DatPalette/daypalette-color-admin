import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import type { CollectionEditorOption } from '@/models/collections'
import { SectionTitle } from './CollectionEditorControls'

function buildPaletteLabelMap(options: CollectionEditorOption[]): Map<string, string> {
  return new Map(options.map((option) => [option.value, option.label]))
}

// Collection 成员编排区，负责排序、封面切换、移除和新增 Palette 成员。
export function CollectionPaletteArrangement({
  coverPaletteId,
  onAddPalette,
  onMovePalette,
  onRemovePalette,
  onSetCoverPalette,
  paletteIds,
  paletteOptions,
}: {
  coverPaletteId: string
  onAddPalette: (paletteId: string) => void
  onMovePalette: (paletteId: string, direction: 'up' | 'down') => void
  onRemovePalette: (paletteId: string) => void
  onSetCoverPalette: (paletteId: string) => void
  paletteIds: string[]
  paletteOptions: CollectionEditorOption[]
}): ReactElement {
  const paletteLabelMap = buildPaletteLabelMap(paletteOptions)
  const availablePaletteOptions = paletteOptions.filter((option) => !paletteIds.includes(option.value))

  return (
    <div className="space-y-4 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] p-4">
      <div className="space-y-2">
        <SectionTitle>Member Arrangement</SectionTitle>
        <p className="text-sm leading-6 text-foreground">
          当前顺序会按 `paletteIds` 直接写回，封面 palette 也必须同时属于成员列表。可以在这里做显式排序、设为封面和移除成员。
        </p>
      </div>

      {paletteIds.length === 0 ? (
        <div className="border border-[var(--dp-border-subtle)] bg-white/70 px-4 py-3 text-sm text-muted-foreground">
          当前还没有成员 palette，请先从下方加入。
        </div>
      ) : (
        <div className="space-y-3">
          {paletteIds.map((paletteId, index) => {
            const isCover = coverPaletteId === paletteId
            const paletteLabel = paletteLabelMap.get(paletteId) ?? paletteId

            return (
              <div
                key={paletteId}
                className="flex items-center justify-between gap-3 border border-[var(--dp-border-subtle)] bg-white/85 px-4 py-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium text-foreground">{paletteLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    第 {index + 1} 位{isCover ? ' · 当前封面' : ''}
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    className="px-3 py-2 text-xs"
                    disabled={index === 0}
                    onClick={() => onMovePalette(paletteId, 'up')}
                    variant="outline"
                  >
                    上移
                  </Button>
                  <Button
                    className="px-3 py-2 text-xs"
                    disabled={index === paletteIds.length - 1}
                    onClick={() => onMovePalette(paletteId, 'down')}
                    variant="outline"
                  >
                    下移
                  </Button>
                  <Button
                    className="px-3 py-2 text-xs"
                    disabled={isCover}
                    onClick={() => onSetCoverPalette(paletteId)}
                    variant="outline"
                  >
                    设为封面
                  </Button>
                  <Button
                    className="px-3 py-2 text-xs"
                    disabled={paletteIds.length === 1}
                    onClick={() => onRemovePalette(paletteId)}
                    variant="outline"
                  >
                    移除
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-3">
        <SectionTitle>Add Palette</SectionTitle>
        {availablePaletteOptions.length === 0 ? (
          <div className="rounded-[18px] border border-[var(--dp-border-hairline)] bg-white/70 px-4 py-3 text-sm text-muted-foreground">
            当前可用 palette 已全部加入这个 collection。
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availablePaletteOptions.map((option) => (
              <button
                key={option.value}
                className="border border-[var(--dp-border-subtle)] bg-white px-3 py-1.5 text-xs text-foreground transition-colors hover:border-[var(--dp-fill-inverse)]"
                onClick={() => onAddPalette(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}