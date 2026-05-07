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