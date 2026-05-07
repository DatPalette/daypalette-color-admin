import type {
  SamplingBatchCollectionDto,
  SamplingBatchDto,
  SamplingRecordDto,
} from '@/models/sampling-batches'

export type EditableSamplingBatchField = 'titleZh' | 'occasionId' | 'notes'

export type EditableSamplingRecordField =
  | 'samplingId'
  | 'themeKey'
  | 'themeLabelZh'
  | 'platform'
  | 'channelType'
  | 'brandName'
  | 'sourceId'
  | 'sourceUrl'
  | 'observedAt'
  | 'itemCategory'
  | 'seasonHint'
  | 'primaryColorSummary'
  | 'secondaryColorSummary'
  | 'accentColorSummary'
  | 'marketSignals'
  | 'notes'
  | 'digestionStatus'

export type EditableSamplingRecordArrayField =
  | 'colorSummary'
  | 'styleSignals'
  | 'candidatePaletteIds'
  | 'finalPaletteIds'

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim())
}

export function parseCommaSeparatedValues(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function stringifyCommaSeparatedValues(values: string[]): string {
  return values.join(', ')
}

export function isSamplingRecordComplete(record: SamplingRecordDto): boolean {
  return (
    hasText(record.platform) &&
    hasText(record.channelType) &&
    hasText(record.brandName) &&
    hasText(record.sourceUrl) &&
    hasText(record.observedAt) &&
    hasText(record.itemCategory) &&
    record.colorSummary.filter((item) => item.trim()).length > 0
  )
}

export function cloneSamplingBatch(batch: SamplingBatchDto | null): SamplingBatchDto | null {
  if (!batch) {
    return null
  }

  return {
    ...batch,
    batch: {
      ...batch.batch,
      sourceWhitelistIds: [...batch.batch.sourceWhitelistIds],
      themeKeys: [...batch.batch.themeKeys],
    },
    items: batch.items.map((item) => ({
      ...item,
      candidatePaletteIds: [...item.candidatePaletteIds],
      colorSummary: [...item.colorSummary],
      finalPaletteIds: [...item.finalPaletteIds],
      styleSignals: [...item.styleSignals],
    })),
    summary: {
      ...batch.summary,
    },
  }
}

export function findSelectedBatch(
  collection: SamplingBatchCollectionDto,
  selectedBatchId: string | null,
): SamplingBatchDto | null {
  return collection.items.find((item) => item.batch.id === selectedBatchId) ?? collection.items[0] ?? null
}

export function findSelectedBatchId(
  collection: SamplingBatchCollectionDto,
  selectedBatchId: string | null,
): string | null {
  return collection.items.find((item) => item.batch.id === selectedBatchId)?.batch.id ?? collection.items[0]?.batch.id ?? null
}

export function findSelectedRecordId(
  draft: SamplingBatchDto | null,
  selectedRecordId: string | null,
): string | null {
  if (!draft) {
    return null
  }

  return draft.items.find((item) => item.samplingId === selectedRecordId)?.samplingId ?? draft.items[0]?.samplingId ?? null
}

export function findSelectedRecord(
  draft: SamplingBatchDto | null,
  selectedRecordId: string | null,
): SamplingRecordDto | null {
  if (!draft) {
    return null
  }

  return draft.items.find((item) => item.samplingId === selectedRecordId) ?? draft.items[0] ?? null
}

export function findFirstIncompleteRecordId(draft: SamplingBatchDto | null): string | null {
  if (!draft) {
    return null
  }

  return draft.items.find((item) => !isSamplingRecordComplete(item))?.samplingId ?? draft.items[0]?.samplingId ?? null
}

export function findFirstPendingReviewRecordId(draft: SamplingBatchDto | null): string | null {
  if (!draft) {
    return null
  }

  return draft.items.find((item) => item.digestionStatus === 'sampled')?.samplingId ?? draft.items[0]?.samplingId ?? null
}

export function buildCollectionWithDraft(
  collection: SamplingBatchCollectionDto,
  draft: SamplingBatchDto | null,
): SamplingBatchCollectionDto {
  if (!draft) {
    return collection
  }

  const hasDraft = collection.items.some((item) => item.batch.id === draft.batch.id)
  const nextItems = hasDraft
    ? collection.items.map((item) => (item.batch.id === draft.batch.id ? draft : item))
    : [draft, ...collection.items]

  return {
    ...collection,
    items: nextItems,
  }
}

export function upsertSamplingBatchInCollection(
  collection: SamplingBatchCollectionDto,
  nextBatch: SamplingBatchDto,
): SamplingBatchCollectionDto {
  return {
    updatedAt: nextBatch.updatedAt,
    version: Math.max(collection.version, nextBatch.version),
    items: buildCollectionWithDraft(collection, nextBatch).items.sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    ),
  }
}

function buildSamplingIdPrefix(batchId: string, occasionId: string): string {
  const batchNumber = batchId.match(/batch(\d+)$/)?.[1]

  return `sam_${occasionId}_${batchNumber ? `b${batchNumber}` : batchId.replace(/-/g, '_')}_`
}

export function buildNewSamplingRecord(batch: SamplingBatchDto): SamplingRecordDto {
  const nextIndex = batch.items.length + 1
  const nextThemeKey = batch.batch.themeKeys[0] ?? ''
  const nextThemeLabel = batch.items.find((item) => item.themeKey === nextThemeKey)?.themeLabelZh ?? ''

  return {
    accentColorSummary: '',
    brandName: '',
    candidatePaletteIds: [],
    channelType: batch.batch.sourceWhitelistIds[0] ?? '',
    colorSummary: [],
    digestionStatus: 'sampled',
    finalPaletteIds: [],
    itemCategory: '',
    marketSignals: '',
    notes: '',
    observedAt: '',
    occasionId: batch.batch.occasionId,
    platform: '',
    primaryColorSummary: '',
    productionBatchId: batch.batch.id,
    samplingId: `${buildSamplingIdPrefix(batch.batch.id, batch.batch.occasionId)}${String(nextIndex).padStart(3, '0')}`,
    seasonHint: '',
    secondaryColorSummary: '',
    sourceId: '',
    sourceUrl: '',
    styleSignals: [],
    themeKey: nextThemeKey,
    themeLabelZh: nextThemeLabel,
  }
}

export function getSamplingBatchValidationMessages(draft: SamplingBatchDto): string[] {
  const messages: string[] = []

  if (!hasText(draft.batch.titleZh)) {
    messages.push('批次标题不能为空。')
  }

  if (!hasText(draft.batch.occasionId)) {
    messages.push('场景 ID 不能为空。')
  }

  if (draft.batch.themeKeys.length === 0) {
    messages.push('至少保留一个主题 key。')
  }

  if (draft.batch.sourceWhitelistIds.length === 0) {
    messages.push('至少保留一个来源白名单渠道。')
  }

  if (new Set(draft.batch.themeKeys).size !== draft.batch.themeKeys.length) {
    messages.push('主题 key 不能重复。')
  }

  const samplingIds = new Set<string>()

  draft.items.forEach((item, index) => {
    if (!hasText(item.samplingId)) {
      messages.push(`第 ${index + 1} 条记录缺少 samplingId。`)
    }

    if (samplingIds.has(item.samplingId)) {
      messages.push(`samplingId ${item.samplingId} 重复。`)
    }

    samplingIds.add(item.samplingId)

    if (!hasText(item.themeKey) || !draft.batch.themeKeys.includes(item.themeKey)) {
      messages.push(`记录 ${item.samplingId || index + 1} 的 themeKey 不在批次主题列表里。`)
    }

    if (!hasText(item.themeLabelZh)) {
      messages.push(`记录 ${item.samplingId || index + 1} 缺少主题中文名。`)
    }

    if (!hasText(item.itemCategory)) {
      messages.push(`记录 ${item.samplingId || index + 1} 缺少品类。`)
    }

    if (item.productionBatchId !== draft.batch.id) {
      messages.push(`记录 ${item.samplingId || index + 1} 的 productionBatchId 与批次不一致。`)
    }

    if (item.occasionId !== draft.batch.occasionId) {
      messages.push(`记录 ${item.samplingId || index + 1} 的 occasionId 与批次不一致。`)
    }

    if (hasText(item.channelType) && !draft.batch.sourceWhitelistIds.includes(item.channelType)) {
      messages.push(`记录 ${item.samplingId || index + 1} 的渠道不在白名单里。`)
    }

    if (item.digestionStatus === 'shortlisted' && item.candidatePaletteIds.length === 0) {
      messages.push(`记录 ${item.samplingId || index + 1} 已入短名单时必须填写候选 palette。`)
    }

    if (item.digestionStatus === 'published' && item.finalPaletteIds.length === 0) {
      messages.push(`记录 ${item.samplingId || index + 1} 已采用时必须填写最终 palette。`)
    }
  })

  if (draft.batch.status !== 'draft' && draft.items.length === 0) {
    messages.push('非草稿批次至少需要一条采样记录。')
  }

  if (draft.batch.status === 'readyForTransfer') {
    const incompleteRecord = draft.items.find((item) => !isSamplingRecordComplete(item))

    if (incompleteRecord) {
      messages.push(`批次进入待转写前，所有记录都必须补齐来源字段。未完成记录：${incompleteRecord.samplingId}。`)
    }
  }

  return Array.from(new Set(messages))
}