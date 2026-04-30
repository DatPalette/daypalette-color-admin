export interface PaletteCardModel {
  id: string
  occasionLabel: string
  sourceCountLabel: string
  status: string
  trioSummary: string
  slug: string
}

export interface PaletteDetailModel {
  accentColorId: string
  fitPhotoScenario: boolean
  id: string
  isPro: boolean
  moodTags: string[]
  occasionId: string
  primaryColorId: string
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