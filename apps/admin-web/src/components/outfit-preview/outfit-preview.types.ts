export type OutfitPreviewMode = 'separates' | 'dress'

export type OutfitPreviewTopTemplate =
  | 'long-sleeve'
  | 'short-sleeve'
  | 'camisole'
  | 'shirt'
  | 'outerwear'

export type OutfitPreviewBottomTemplate =
  | 'trousers'
  | 'shorts'
  | 'mini-skirt'
  | 'midi-skirt'
  | 'maxi-skirt'

export type OutfitPreviewDressTemplate = 'mini-dress' | 'midi-dress' | 'maxi-dress'

export type OutfitPreviewTemplateId =
  | OutfitPreviewTopTemplate
  | OutfitPreviewBottomTemplate
  | OutfitPreviewDressTemplate

export type OutfitPreviewSlot = 'main' | 'secondary' | 'accent'

export interface OutfitPreviewColorToken {
  hex: string
  label: string
}

export interface OutfitPreviewModel {
  silhouetteId: 'female-line-v1'
  mode: OutfitPreviewMode
  topTemplate?: OutfitPreviewTopTemplate
  bottomTemplate?: OutfitPreviewBottomTemplate
  dressTemplate?: OutfitPreviewDressTemplate
  colors: Record<OutfitPreviewSlot, OutfitPreviewColorToken>
}

export interface OutfitPreviewSurface {
  id: string
  opacity?: number
  path: string
  slot: OutfitPreviewSlot
}

export interface OutfitPreviewTemplateDefinition<TemplateId extends OutfitPreviewTemplateId> {
  id: TemplateId
  label: string
  mode: OutfitPreviewMode
  surfaces: OutfitPreviewSurface[]
}

export interface OutfitPreviewProps {
  model: OutfitPreviewModel
  availableBottomTemplates?: OutfitPreviewBottomTemplate[]
  availableDressTemplates?: OutfitPreviewDressTemplate[]
  availableTopTemplates?: OutfitPreviewTopTemplate[]
  className?: string
  onBottomTemplateChange?: (template: OutfitPreviewBottomTemplate) => void
  onDressTemplateChange?: (template: OutfitPreviewDressTemplate) => void
  onModeChange?: (mode: OutfitPreviewMode) => void
  onTopTemplateChange?: (template: OutfitPreviewTopTemplate) => void
  showControls?: boolean
  showLegend?: boolean
}