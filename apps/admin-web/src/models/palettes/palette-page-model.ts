import type { PaletteReferenceSourceDto } from './palette.dto'

export interface PaletteCardModel {
  id: string
  occasionLabel: string
  previewHexes: string[]
  sourceCountLabel: string
  status: string
  trioSummary: string
  slug: string
}

export interface PaletteDetailModel {
  accentColorId: string
  archiveReason?: string
  archivedAt?: string
  fitPhotoScenario: boolean
  id: string
  isPro: boolean
  marketSignalSummary?: string
  moodTags: string[]
  occasionId: string
  primaryColorId: string
  productionBatchId?: string
  referenceMethod?: string
  referenceSources?: PaletteReferenceSourceDto[]
  reviewNotes?: string
  reviewStatus?: string
  reviewedAt?: string
  reviewer?: string
  safetyLevel: string
  seasonTags: string[]
  secondaryColorId: string
  slug: string
  sourceCollectionIds: string[]
  sourceType: string
  status: string
  styleTags: string[]
}

export interface PalettesPageModel {
  cards: PaletteCardModel[]
  detail: PaletteDetailModel | null
  totalLabel: string
  updatedAtLabel: string
}