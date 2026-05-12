import type { ReactElement } from 'react'

import { cn } from '@/utils/cn'

import { outfitPreviewDefaults } from './outfit-preview.templates'
import { OutfitPreviewControls } from './OutfitPreviewControls'
import { OutfitPreviewLegend } from './OutfitPreviewLegend'
import { getOutfitPreviewTemplateLabel, resolveOutfitPreviewModel } from './outfit-preview.utils'
import type { OutfitPreviewProps } from './outfit-preview.types'

const templateSurfaceStroke = 'rgba(63, 58, 56, 0.14)'
const silhouetteStroke = 'rgba(63, 58, 56, 0.22)'
const skinFill = '#F6E4D8'
const hairFill = '#6F594C'
const detailStroke = 'rgba(63, 58, 56, 0.16)'

function OutfitPreviewFigure({
  model,
}: {
  model: ReturnType<typeof resolveOutfitPreviewModel>
}): ReactElement {
  const surfaces = model.mode === 'dress'
    ? (model.dressTemplate?.surfaces ?? [])
    : [...(model.topTemplate?.surfaces ?? []), ...(model.bottomTemplate?.surfaces ?? [])]

  return (
    <svg
      aria-hidden="true"
      className="mx-auto w-full max-w-[304px]"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 240 340"
    >
      <ellipse cx="120" cy="322" fill="rgba(63, 58, 56, 0.08)" rx="50" ry="10" />

      <path
        d="M100 74 Q98 84 100 98 H140 Q142 84 140 74 Q136 66 120 66 Q104 66 100 74 Z"
        fill={skinFill}
        stroke={silhouetteStroke}
        strokeWidth="1.4"
      />
      <path
        d="M101 98 C88 114 78 132 74 158 C71 174 73 186 80 194 C85 197 90 194 94 186 C92 160 95 130 103 100 Z"
        fill={skinFill}
        stroke={silhouetteStroke}
        strokeWidth="1.4"
      />
      <path
        d="M139 98 C152 114 162 132 166 158 C169 174 167 186 160 194 C155 197 150 194 146 186 C148 160 145 130 137 100 Z"
        fill={skinFill}
        stroke={silhouetteStroke}
        strokeWidth="1.4"
      />
      <path
        d="M110 182 C106 214 103 250 102 304 C102 312 98 317 92 320 C88 320 86 317 86 312 C89 258 94 216 100 182 Z"
        fill={skinFill}
        stroke={silhouetteStroke}
        strokeWidth="1.4"
      />
      <path
        d="M130 182 C134 214 137 250 138 304 C138 312 142 317 148 320 C152 320 154 317 154 312 C151 258 146 216 140 182 Z"
        fill={skinFill}
        stroke={silhouetteStroke}
        strokeWidth="1.4"
      />

      {surfaces.map((surface) => (
        <path
          key={surface.id}
          d={surface.path}
          fill={model.colors[surface.slot].hex}
          fillOpacity={surface.opacity ?? 1}
          stroke={templateSurfaceStroke}
          strokeWidth="1.5"
        />
      ))}

      <path d="M108 186 Q120 176 132 186" stroke={detailStroke} strokeWidth="1.2" />
      <path d="M112 72 Q120 82 128 72" stroke={detailStroke} strokeWidth="1.1" />
      <path d="M108 314 H120 V320 H96 Q98 316 108 314 Z" fill={hairFill} fillOpacity="0.9" />
      <path d="M120 314 H132 Q142 316 144 320 H120 Z" fill={hairFill} fillOpacity="0.9" />
      <circle cx="120" cy="46" fill={skinFill} r="19" stroke={silhouetteStroke} strokeWidth="1.4" />
      <path
        d="M101 42 C101 24 112 14 127 15 C138 16 147 25 147 43 C147 53 144 64 139 73 H101 C96 65 93 54 95 44 C96 41 99 40 101 42 Z"
        fill={hairFill}
        stroke={silhouetteStroke}
        strokeWidth="1.4"
      />
      <path d="M114 48 Q120 51 126 48" stroke={detailStroke} strokeWidth="1" />
    </svg>
  )
}

export function OutfitPreview({
  availableBottomTemplates,
  availableDressTemplates,
  availableTopTemplates,
  className,
  model,
  onBottomTemplateChange,
  onDressTemplateChange,
  onModeChange,
  onTopTemplateChange,
  showControls = true,
  showLegend = true,
}: OutfitPreviewProps): ReactElement {
  const resolved = resolveOutfitPreviewModel(model)
  const currentTemplateLabel = resolved.mode === 'dress'
    ? getOutfitPreviewTemplateLabel(resolved.dressTemplate?.id ?? outfitPreviewDefaults.dressTemplate)
    : `${getOutfitPreviewTemplateLabel(resolved.topTemplate?.id ?? outfitPreviewDefaults.topTemplate)} / ${getOutfitPreviewTemplateLabel(
        resolved.bottomTemplate?.id ?? outfitPreviewDefaults.bottomTemplate,
      )}`

  return (
    <div
      className={cn(
        'rounded-[20px] border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] p-5',
        className,
      )}
    >
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-[280px] flex-[1.2_1_320px] space-y-4 rounded-[18px] border border-[var(--dp-border-subtle)] bg-white p-5 shadow-[0_20px_32px_-28px_rgba(26,26,26,0.28)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="label-caps text-muted-foreground">模特试色预览</p>
              <p className="text-sm leading-6 text-muted-foreground">{currentTemplateLabel}</p>
            </div>
            <span className="inline-flex items-center rounded-full border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {resolved.mode === 'dress' ? '连衣' : '分体'}
            </span>
          </div>

          <div className="flex min-h-[360px] items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,rgba(247,243,242,0.96),rgba(255,255,255,0.98))] px-4 py-5">
            <OutfitPreviewFigure model={resolved} />
          </div>
        </div>

        {showControls ? (
          <div className="min-w-[280px] flex-[1_1_320px]">
            <OutfitPreviewControls
              availableBottomTemplates={availableBottomTemplates}
              availableDressTemplates={availableDressTemplates}
              availableTopTemplates={availableTopTemplates}
              bottomTemplate={resolved.bottomTemplate?.id ?? outfitPreviewDefaults.bottomTemplate}
              dressTemplate={resolved.dressTemplate?.id ?? outfitPreviewDefaults.dressTemplate}
              mode={resolved.mode}
              onBottomTemplateChange={onBottomTemplateChange}
              onDressTemplateChange={onDressTemplateChange}
              onModeChange={onModeChange}
              onTopTemplateChange={onTopTemplateChange}
              topTemplate={resolved.topTemplate?.id ?? outfitPreviewDefaults.topTemplate}
            />
          </div>
        ) : null}
      </div>

      {showLegend ? <OutfitPreviewLegend className="mt-4" colors={resolved.colors} /> : null}
    </div>
  )
}