export type AdminResourceKey =
  | 'dictionaries'
  | 'base-colors'
  | 'palettes'
  | 'collections'

export interface SoftDeleteMetadata {
  deletedAt?: string
  deleteReason?: string
  previousStatus?: string
}

export interface DictionaryOptionState {
  isActive: boolean
  isDeleted: boolean
}

export type PaletteReferenceMethod =
  | 'market-sampled'
  | 'editorial-derived'
  | 'internal-recomposition'

export type PaletteReviewStatus = 'pending' | 'needsRevision' | 'approved' | 'rejected'

export type PaletteReferenceChannelType =
  | 'brand-site'
  | 'brand-flagship-store'
  | 'multi-brand-platform'
  | 'marketplace-brand-store'

export interface PaletteReferenceSource {
  brandName: string
  channelType: PaletteReferenceChannelType | string
  colorSummary: string[]
  itemCategory: string
  notes: string
  observedAt: string
  platform: string
  sourceId: string
  sourceUrl: string
}

export interface PaletteOperationalMetadata {
  archiveReason?: string
  archivedAt?: string
  marketSignalSummary?: string
  productionBatchId?: string
  referenceMethod?: PaletteReferenceMethod | string
  referenceSources?: PaletteReferenceSource[]
  reviewNotes?: string
  reviewStatus?: PaletteReviewStatus | string
  reviewedAt?: string
  reviewer?: string
}

export type SamplingBatchStatus =
  | 'draft'
  | 'collecting'
  | 'clustering'
  | 'readyForTransfer'
  | 'archived'

export type SamplingDigestionStatus =
  | 'sampled'
  | 'clustered'
  | 'shortlisted'
  | 'published'
  | 'rejected'

export interface SamplingBatchMeta {
  id: string
  notes?: string
  occasionId: string
  sourceWhitelistIds: string[]
  status: SamplingBatchStatus
  themeKeys: string[]
  titleZh: string
}

export interface SamplingBatchSummary {
  completedCount: number
  recordCount: number
  uniqueBrandCount: number
  uniquePlatformCount: number
}

export interface SamplingCandidateGenerationCapabilities {
  defaultMode: 'hybrid' | 'rules-only'
  modelEnabled: boolean
  rulesEnabled: boolean
}

export interface SamplingRecord extends PaletteReferenceSource {
  accentColorSummary?: string
  candidatePaletteIds: string[]
  digestionStatus: SamplingDigestionStatus
  finalPaletteIds: string[]
  marketSignals?: string
  occasionId: string
  primaryColorSummary?: string
  productionBatchId: string
  samplingId: string
  seasonHint?: string
  secondaryColorSummary?: string
  styleSignals: string[]
  themeKey: string
  themeLabelZh: string
}

export interface SamplingBatchDocument {
  batch: SamplingBatchMeta
  items: SamplingRecord[]
  summary: SamplingBatchSummary
  updatedAt: string
  version: number
}

export interface SamplingBatchCollectionDocument {
  items: SamplingBatchDocument[]
  updatedAt: string
  version: number
}