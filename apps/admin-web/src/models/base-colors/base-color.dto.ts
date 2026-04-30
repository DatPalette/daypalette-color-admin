export interface BaseColorDto {
  colorFamily: string
  deleteReason?: string
  deletedAt?: string
  hex: string
  id: string
  isNeutralCore: boolean
  lightnessLevel: string
  nameEn: string
  nameZh: string
  occasionTags: string[]
  previousStatus?: string
  saturationLevel: string
  seasonTags: string[]
  status: string
  styleTags: string[]
  tone: string
}

export type BaseColorCreateDto = Omit<BaseColorDto, 'deleteReason' | 'deletedAt' | 'previousStatus'>

export type BaseColorUpdateDto = Omit<
  BaseColorDto,
  'deleteReason' | 'deletedAt' | 'id' | 'previousStatus'
>

export interface BaseColorDeleteDto {
  deleteReason?: string
}

export interface BaseColorDeleteCheckReferenceDto {
  id: string
  referenceField: 'accentColorId' | 'primaryColorId' | 'secondaryColorId'
  resource: 'palette'
  slug: string
}

export interface BaseColorDeleteCheckDto {
  blockingReferences: BaseColorDeleteCheckReferenceDto[]
  canDelete: boolean
  targetId: string
  targetNameEn: string
  targetNameZh: string
}

export interface BaseColorCollectionDto {
  items: BaseColorDto[]
  updatedAt: string
  version: number
}

export interface BaseColorDictionaryItemDto {
  id: string
  isActive: boolean
  isDeleted: boolean
  labelEn: string
  labelZh: string
}

export interface BaseColorDictionaryDto {
  items: BaseColorDictionaryItemDto[]
}

export interface BaseColorEditorDictionariesDto {
  dictionaries: {
    colorFamily: BaseColorDictionaryDto
    lightnessLevel: BaseColorDictionaryDto
    occasion: BaseColorDictionaryDto
    saturationLevel: BaseColorDictionaryDto
    seasonTag: BaseColorDictionaryDto
    status: BaseColorDictionaryDto
    styleTag: BaseColorDictionaryDto
    tone: BaseColorDictionaryDto
  }
}