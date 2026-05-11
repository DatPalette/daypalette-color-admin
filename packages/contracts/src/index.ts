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
  remainingVisibleUniqueCapacity: number
  uniqueBrandCount: number
  uniquePlatformCount: number
  visibleUniqueCapacity: number
  visibleUniqueCount: number
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

export type SamplingRunOperationType =
  | 'generate-candidates'
  | 'discover-sources'
  | 'collect-evidence'
  | 'extract-colors'
  | 'cluster-palettes'
  | 'llm-batch-generate'

export type SamplingRunStatus =
  | 'queued'
  | 'running'
  | 'needsManualInput'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

export type SamplingRunEventLevel = 'info' | 'warning' | 'error'

export type SamplingRunEventType =
  | 'run-created'
  | 'stage-started'
  | 'candidate-link-found'
  | 'page-opened'
  | 'page-skipped'
  | 'auth-required'
  | 'manual-evidence-requested'
  | 'screenshot-captured'
  | 'image-selected'
  | 'colors-extracted'
  | 'cluster-created'
  | 'cluster-merged'
  | 'model-analysis-started'
  | 'model-analysis-finished'
  | 'llm-generation-started'
  | 'llm-record-generated'
  | 'llm-generation-finished'
  | 'warning'
  | 'error'
  | 'run-finished'

export interface SamplingRunSummary {
  batchId: string
  currentStage: string
  errorCount: number
  finishedAt?: string
  operationType: SamplingRunOperationType
  progressPercent: number
  runId: string
  startedAt: string
  status: SamplingRunStatus
  summary?: string
  warningCount: number
}

export interface SamplingRunEvent {
  createdAt: string
  eventId: string
  level: SamplingRunEventLevel
  message: string
  metadata?: Record<string, unknown>
  progressPercent?: number
  runId: string
  stage?: string
  type: SamplingRunEventType
}

export interface SamplingRunCollectionDocument {
  items: SamplingRunSummary[]
  updatedAt: string
  version: number
}

export interface SamplingRunEventCollectionDocument {
  items: SamplingRunEvent[]
  runId: string
  updatedAt: string
  version: number
}

// ── Color collection: LLM batch generation params ──

export interface LlmBatchGenerateParams {
  occasionId: string
  titleZh: string
  themeKeys: string[]
  targetCount: number
  styleConstraints?: string
  sourceWhitelistIds?: string[]
}

// ── Color collection: image extraction params ──

export interface ImageExtractionParams {
  imageUrls?: string[]
  occasionId: string
  themeKey: string
  themeLabelZh: string
  batchId?: string
  enableVisionAnalysis?: boolean
}

export interface ExtractedColor {
  hex: string
  percentage: number
  semanticLabel?: string
}