import type {
  PaletteReferenceChannelType,
  SamplingBatchStatus,
  SamplingDigestionStatus,
} from '@daypalette-color-admin/contracts'

export interface SamplingOption<TValue extends string> {
  label: string
  value: TValue
}

export const samplingBatchStatusOptions: SamplingOption<SamplingBatchStatus>[] = [
  { value: 'draft', label: '草稿' },
  { value: 'collecting', label: '采集中' },
  { value: 'clustering', label: '聚类中' },
  { value: 'readyForTransfer', label: '待转写' },
  { value: 'archived', label: '已归档' },
]

export const samplingDigestionStatusOptions: SamplingOption<SamplingDigestionStatus>[] = [
  { value: 'sampled', label: '待审阅' },
  { value: 'clustered', label: '审阅通过' },
  { value: 'shortlisted', label: '候选待采用' },
  { value: 'published', label: '已转写采用' },
  { value: 'rejected', label: '已驳回' },
]

export const samplingChannelTypeOptions: SamplingOption<PaletteReferenceChannelType>[] = [
  { value: 'brand-site', label: '品牌官网' },
  { value: 'brand-flagship-store', label: '官方旗舰店' },
  { value: 'multi-brand-platform', label: '多品牌平台' },
  { value: 'marketplace-brand-store', label: '平台品牌店' },
]

export const samplingOccasionLabelMap: Record<string, string> = {
  'city-weekend': '周末约会',
  holiday: '节假日',
  'holiday-outing': '清风户外',
  'light-social': '晚宴流光',
  weekend: '周末',
  workday: '温柔通勤',
}

export function getSamplingBatchStatusLabel(status: string): string {
  return samplingBatchStatusOptions.find((item) => item.value === status)?.label ?? status ?? '未设置'
}

export function getSamplingDigestionStatusLabel(status: string): string {
  return samplingDigestionStatusOptions.find((item) => item.value === status)?.label ?? status ?? '未设置'
}

export function getSamplingChannelTypeLabel(channelType: string): string {
  return samplingChannelTypeOptions.find((item) => item.value === channelType)?.label ?? channelType ?? '未设置'
}

export function getSamplingOccasionLabel(occasionId: string): string {
  return samplingOccasionLabelMap[occasionId] ?? occasionId ?? '未设置'
}