export interface DictionaryCardModel {
  itemCountLabel: string
  key: string
  labelEn: string
  labelZh: string
  scopeSummary: string
  selectionModeLabel: string
}

export interface DictionariesPageModel {
  cards: DictionaryCardModel[]
  totalLabel: string
  updatedAtLabel: string
}