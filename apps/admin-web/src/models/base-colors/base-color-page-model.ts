export interface BaseColorCardModel {
  colorFamily: string
  hex: string
  id: string
  nameEn: string
  nameZh: string
  status: string
  tagSummary: string
}

export interface BaseColorDetailModel {
  colorFamily: string
  hex: string
  id: string
  isNeutralCore: boolean
  lightnessLevel: string
  moodSummary: string
  nameEn: string
  nameZh: string
  occasionTags: string[]
  saturationLevel: string
  seasonTags: string[]
  status: string
  styleTags: string[]
  tone: string
}

export interface BaseColorsPageModel {
  cards: BaseColorCardModel[]
  detail: BaseColorDetailModel | null
  totalLabel: string
  updatedAtLabel: string
}