import type {
  SamplingBatchCardModel,
  SamplingBatchCollectionDto,
  SamplingBatchDetailModel,
  SamplingBatchDto,
  SamplingBatchesPageModel,
  SamplingRecordPreviewModel,
} from '@/models/sampling-batches'
import {
  getSamplingBatchStatusLabel,
  getSamplingDigestionStatusLabel,
} from '@/models/sampling-batches'
import { formatUpdatedAtLabel } from '@/utils/format-updated-at-label'

function toSamplingBatchCardModel(item: SamplingBatchDto): SamplingBatchCardModel {
  return {
    completedLabel: `${item.summary.completedCount} / ${item.summary.recordCount} 条完整`,
    id: item.batch.id,
    occasionLabel: item.batch.occasionId,
    recordCountLabel: `${item.summary.recordCount} 条采样记录`,
    statusLabel: getSamplingBatchStatusLabel(item.batch.status),
    titleZh: item.batch.titleZh,
    updatedAtLabel: formatUpdatedAtLabel(item.updatedAt),
  }
}

function toSamplingRecordPreviewModel(item: SamplingBatchDto): SamplingRecordPreviewModel[] {
  return item.items.slice(0, 8).map((record) => ({
    brandName: record.brandName || '待补品牌',
    digestionStatusLabel: getSamplingDigestionStatusLabel(record.digestionStatus),
    itemCategory: record.itemCategory || '待补品类',
    samplingId: record.samplingId,
    themeLabelZh: record.themeLabelZh || record.themeKey,
  }))
}

function toSamplingBatchDetailModel(item: SamplingBatchDto | null): SamplingBatchDetailModel | null {
  if (!item) {
    return null
  }

  return {
    completedLabel: `${item.summary.completedCount} / ${item.summary.recordCount} 条来源字段完整`,
    notes: item.batch.notes || '当前没有批次备注。',
    occasionLabel: item.batch.occasionId,
    recordCountLabel: `${item.summary.recordCount} 条采样记录`,
    recordPreviews: toSamplingRecordPreviewModel(item),
    sourceWhitelistIds: item.batch.sourceWhitelistIds,
    statusLabel: getSamplingBatchStatusLabel(item.batch.status),
    themeKeys: item.batch.themeKeys,
    titleZh: item.batch.titleZh,
    uniqueCoverageLabel: `${item.summary.uniquePlatformCount} 个平台 / ${item.summary.uniqueBrandCount} 个品牌`,
  }
}

export function toSamplingBatchesPageModel(
  collection: SamplingBatchCollectionDto,
  selectedBatchId: string | null,
): SamplingBatchesPageModel {
  const detailBatch = collection.items.find((item) => item.batch.id === selectedBatchId) ?? collection.items[0] ?? null
  const archivedCount = collection.items.filter((item) => item.batch.status === 'archived').length

  return {
    archivedLabel: `${archivedCount} 个已归档批次`,
    cards: collection.items.map((item) => toSamplingBatchCardModel(item)),
    detail: toSamplingBatchDetailModel(detailBatch),
    totalLabel: `${collection.items.length} 个采样批次`,
    updatedAtLabel: formatUpdatedAtLabel(collection.updatedAt),
  }
}