import {
  outfitPreviewBottomTemplateMap,
  outfitPreviewDefaults,
  outfitPreviewDressTemplateMap,
  outfitPreviewFallbackColors,
  outfitPreviewTopTemplateMap,
} from './outfit-preview.templates'
import type {
  OutfitPreviewBottomTemplate,
  OutfitPreviewColorToken,
  OutfitPreviewDressTemplate,
  OutfitPreviewModel,
  OutfitPreviewSlot,
  OutfitPreviewTemplateDefinition,
  OutfitPreviewTopTemplate,
} from './outfit-preview.types'

const hexPattern = /^#(?:[\dA-F]{3}){1,2}$/i

export const outfitPreviewSlotLabels: Record<OutfitPreviewSlot, string> = {
  accent: '点缀',
  main: '主色',
  secondary: '次色',
}

export interface ResolvedOutfitPreviewModel {
  bottomTemplate?: OutfitPreviewTemplateDefinition<OutfitPreviewBottomTemplate>
  colors: Record<OutfitPreviewSlot, OutfitPreviewColorToken>
  dressTemplate?: OutfitPreviewTemplateDefinition<OutfitPreviewDressTemplate>
  mode: OutfitPreviewModel['mode']
  silhouetteId: OutfitPreviewModel['silhouetteId']
  topTemplate?: OutfitPreviewTemplateDefinition<OutfitPreviewTopTemplate>
}

function normalizeColorToken(
  token: OutfitPreviewColorToken | undefined,
  slot: OutfitPreviewSlot,
): OutfitPreviewColorToken {
  const fallback = outfitPreviewFallbackColors[slot]
  const label = token?.label.trim() || fallback.label
  const hex = hexPattern.test(token?.hex ?? '') ? token!.hex : fallback.hex

  return { hex, label }
}

export function getOutfitPreviewSlotLabel(slot: OutfitPreviewSlot): string {
  return outfitPreviewSlotLabels[slot]
}

export function getOutfitPreviewTemplateLabel(
  template: OutfitPreviewTopTemplate | OutfitPreviewBottomTemplate | OutfitPreviewDressTemplate,
): string {
  return outfitPreviewTopTemplateMap[template as OutfitPreviewTopTemplate]?.label
    ?? outfitPreviewBottomTemplateMap[template as OutfitPreviewBottomTemplate]?.label
    ?? outfitPreviewDressTemplateMap[template as OutfitPreviewDressTemplate]?.label
    ?? template
}

export function resolveOutfitPreviewModel(model: OutfitPreviewModel): ResolvedOutfitPreviewModel {
  const mode = model.mode === 'dress' ? 'dress' : 'separates'

  return {
    bottomTemplate:
      mode === 'separates'
        ? outfitPreviewBottomTemplateMap[model.bottomTemplate ?? outfitPreviewDefaults.bottomTemplate]
        : undefined,
    colors: {
      accent: normalizeColorToken(model.colors.accent, 'accent'),
      main: normalizeColorToken(model.colors.main, 'main'),
      secondary: normalizeColorToken(model.colors.secondary, 'secondary'),
    },
    dressTemplate:
      mode === 'dress'
        ? outfitPreviewDressTemplateMap[model.dressTemplate ?? outfitPreviewDefaults.dressTemplate]
        : undefined,
    mode,
    silhouetteId: model.silhouetteId,
    topTemplate:
      mode === 'separates'
        ? outfitPreviewTopTemplateMap[model.topTemplate ?? outfitPreviewDefaults.topTemplate]
        : undefined,
  }
}