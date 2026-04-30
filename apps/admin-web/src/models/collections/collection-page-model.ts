export interface CollectionCardModel {
  coverPaletteSlug: string
  id: string
  nameEn: string
  nameZh: string
  paletteCountLabel: string
  status: string
  themeType: string
}

export interface CollectionDetailModel {
  coverPaletteId: string
  coverPaletteSlug: string
  descriptionEn?: string
  descriptionZh?: string
  id: string
  isPro: boolean
  nameEn: string
  nameZh: string
  occasionTags: string[]
  paletteIds: string[]
  paletteSlugs: string[]
  releaseMode: string
  status: string
  styleTags: string[]
  themeType: string
}

export interface CollectionsPageModel {
  cards: CollectionCardModel[]
  detail: CollectionDetailModel | null
  totalLabel: string
  updatedAtLabel: string
}