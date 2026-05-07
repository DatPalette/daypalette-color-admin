import type {
  PaletteOperationalMetadata,
  PaletteReferenceSource,
} from '@daypalette-color-admin/contracts'

export type PaletteReferenceSourceDto = PaletteReferenceSource

export interface PaletteDto extends PaletteOperationalMetadata {
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
  referenceSources?: PaletteReferenceSourceDto[]
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