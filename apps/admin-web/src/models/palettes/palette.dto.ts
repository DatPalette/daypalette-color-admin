export interface PaletteDto {
  accentColorId: string
  deleteReason?: string
  deletedAt?: string
  fitPhotoScenario: boolean
  id: string
  isPro: boolean
  moodTags: string[]
  occasionId: string
  previousStatus?: string
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

export type PaletteCreateDto = Omit<PaletteDto, 'deleteReason' | 'deletedAt' | 'previousStatus'>

export type PaletteUpdateDto = Omit<PaletteDto, 'deleteReason' | 'deletedAt' | 'id' | 'previousStatus'>

export interface PaletteDeleteDto {
  deleteReason?: string
}

export interface PaletteDeleteCheckReferenceDto {
  displayLabel: string
  id: string
  referenceField: 'coverPaletteId' | 'paletteIds'
  resource: 'collection'
}

export interface PaletteDeleteCheckDto {
  blockingReferences: PaletteDeleteCheckReferenceDto[]
  canDelete: boolean
  targetId: string
  targetSlug: string
}

export interface PaletteCollectionDto {
  items: PaletteDto[]
  updatedAt: string
  version: number
}