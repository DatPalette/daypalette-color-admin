export interface DictionaryFieldMappingDto {
  entity: string
  field: string
  selectionMode: 'mixed' | 'multi' | 'single'
}

export interface DictionaryItemDto {
  aliases?: string[]
  appliesTo?: string[]
  deleteReason?: string
  deletedAt?: string
  descriptionEn?: string
  descriptionZh?: string
  id: string
  isActive: boolean
  isDeleted: boolean
  labelEn: string
  labelZh: string
  sortOrder: number
}

export type DictionaryItemCreateDto = Omit<DictionaryItemDto, 'deleteReason' | 'deletedAt' | 'isDeleted'>

export interface DictionaryItemDeleteCheckReferenceDto {
  displayLabel: string
  id: string
  referenceField: string
  resource: 'baseColor' | 'collection' | 'palette'
}

export interface DictionaryItemDeleteCheckDto {
  blockingReferences: DictionaryItemDeleteCheckReferenceDto[]
  canDelete: boolean
  dictionaryKey: string
  itemId: string
  itemLabelEn: string
  itemLabelZh: string
}

export interface DictionaryNodeDto {
  descriptionEn?: string
  descriptionZh?: string
  entityScopes: string[]
  fieldMappings: DictionaryFieldMappingDto[]
  items: DictionaryItemDto[]
  key: string
  labelEn: string
  labelZh: string
  selectionMode: 'mixed' | 'multi' | 'single'
}

export interface DictionariesDocumentDto {
  dictionaries: Record<string, DictionaryNodeDto>
  updatedAt: string
  version: number
}