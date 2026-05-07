export interface SamplingBatchCardModel {
  completedLabel: string
  id: string
  occasionLabel: string
  recordCountLabel: string
  statusLabel: string
  titleZh: string
  updatedAtLabel: string
}

export interface SamplingRecordPreviewModel {
  brandName: string
  digestionStatusLabel: string
  itemCategory: string
  samplingId: string
  themeLabelZh: string
}

export interface SamplingBatchDetailModel {
  completedLabel: string
  notes: string
  occasionLabel: string
  recordCountLabel: string
  recordPreviews: SamplingRecordPreviewModel[]
  sourceWhitelistIds: string[]
  statusLabel: string
  themeKeys: string[]
  titleZh: string
  uniqueCoverageLabel: string
}

export interface SamplingBatchesPageModel {
  archivedLabel: string
  cards: SamplingBatchCardModel[]
  detail: SamplingBatchDetailModel | null
  totalLabel: string
  updatedAtLabel: string
}