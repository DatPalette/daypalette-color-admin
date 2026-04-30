export interface CollectionDto {
  coverPaletteId: string
  deleteReason?: string
  deletedAt?: string
  descriptionEn?: string
  descriptionZh?: string
  id: string
  isPro: boolean
  nameEn: string
  nameZh: string
  occasionTags: string[]
  paletteIds: string[]
  previousStatus?: string
  releaseMode: string
  status: string
  styleTags: string[]
  themeType: string
}

export type CollectionUpdateDto = Omit<
  CollectionDto,
  'deleteReason' | 'deletedAt' | 'id' | 'previousStatus'
>

export interface CollectionDeleteDto {
  deleteReason?: string
}

export interface CollectionDeleteCheckReferenceDto {
  displayLabel: string
  id: string
  referenceField: 'sourceCollectionIds'
  resource: 'palette'
}

export interface CollectionDeleteCheckDto {
  blockingReferences: CollectionDeleteCheckReferenceDto[]
  canDelete: boolean
  targetId: string
  targetNameEn: string
  targetNameZh: string
}

export interface CollectionsDocumentDto {
  items: CollectionDto[]
  updatedAt: string
  version: number
}