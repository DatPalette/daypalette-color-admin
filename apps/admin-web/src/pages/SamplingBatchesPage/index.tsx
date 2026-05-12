import { useState, useCallback, type KeyboardEvent, type ReactElement, type ReactNode } from 'react'
import {
  CheckCheck,
  ImageIcon,
  Layers3,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DetailDrawer } from '@/components/workbench/DetailDrawer'
import { WorkbenchPageHeader } from '@/components/workbench/WorkbenchPageHeader'
import { WorkbenchModal } from '@/components/workbench/WorkbenchModal'
import {
  getSamplingChannelTypeLabel,
  getSamplingDigestionStatusLabel,
  getSamplingOccasionLabel,
  samplingBatchStatusOptions,
  samplingChannelTypeOptions,
  samplingDigestionStatusOptions,
  type SamplingRecordDto,
} from '@/models/sampling-batches'
import type {
  SamplingRunDto,
  SamplingRunEventDto,
} from '@/models/sampling-runs'
import type { LlmBatchGenerateParams } from '@daypalette-color-admin/contracts'
import { cn } from '@/utils/cn'
import { useSamplingBatchesPageViewModel } from './view-model/useSamplingBatchesPageViewModel'
import {
  isSamplingRecordComplete,
  stringifyCommaSeparatedValues,
} from './view-model/helpers'
import { LlmGenerationForm } from '@/components/sampling/LlmGenerationForm'
import { ImageExtractionForm } from '@/components/sampling/ImageExtractionForm'
import {
  createSamplingRun,
  getSamplingRun,
  subscribeToSamplingRunStream,
} from '@/services/sampling-runs/sampling-runs.service'
import {
  extractColorsFromUrls,
  extractColorsFromFiles,
} from '@/services/color-collection/color-collection.service'

const inputClassName =
  'w-full rounded-[14px] border border-[var(--dp-border-subtle)] bg-white/92 px-3.5 py-2.5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] outline-none transition focus:border-[var(--dp-fill-inverse)] focus:bg-white'

const textareaClassName = `${inputClassName} min-h-[112px] resize-y`

const labelClassName = 'label-caps text-muted-foreground'

const fieldShellClassName =
  'space-y-3 rounded-[20px] border border-[var(--dp-border-hairline)] bg-[rgba(247,243,242,0.88)] p-4'

const semanticPreviewColorPresets = [
  {
    hex: '#F3EEE6',
    keywords: ['壳白', '米白', '奶白', '乳白', '象牙白', '暖白', '白'],
  },
  {
    hex: '#A9B7C4',
    keywords: ['雾蓝', '灰蓝', '雾灰蓝', '蓝灰', 'steel blue', 'mist blue'],
  },
  {
    hex: '#CCB79E',
    keywords: ['浅卡其', '卡其', '沙色', '燕麦', '驼', 'camel', 'khaki', 'beige'],
  },
  {
    hex: '#61656B',
    keywords: ['炭灰', '深灰', '石墨', 'charcoal', 'graphite', '灰'],
  },
  {
    hex: '#31445D',
    keywords: ['藏蓝', '海军蓝', 'navy'],
  },
  {
    hex: '#8E9780',
    keywords: ['橄榄', '鼠尾草', 'sage', '军绿', '苔绿', 'olive'],
  },
  {
    hex: '#7D6154',
    keywords: ['咖', '棕', '可可', 'brown', 'mocha'],
  },
  {
    hex: '#A05C56',
    keywords: ['砖红', '赤陶', 'terracotta', 'rust'],
  },
] as const

const fallbackPreviewHexes = ['#F3EEE6', '#A9B7C4', '#CCB79E'] as const

interface SamplingBadgeProps {
  children: ReactNode
  tone?: 'default' | 'dark' | 'ok' | 'soft'
}

interface SamplingEvidenceTimelineItem {
  detail: string
  title: string
}

interface SamplingPreviewSwatch {
  hex: string
  label: string
  slot: string
}

function SamplingBadge({ children, tone = 'default' }: SamplingBadgeProps): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]',
        tone === 'dark' && 'border-[var(--dp-fill-inverse)] bg-[var(--dp-fill-inverse)] text-[var(--dp-text-on-inverse)]',
        tone === 'ok' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        tone === 'soft' && 'border-[var(--dp-border-subtle)] bg-white/72 text-muted-foreground',
        tone === 'default' && 'border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] text-foreground',
      )}
    >
      {children}
    </span>
  )
}

function getFallbackPreviewHex(fallbackIndex: number): string {
  if (fallbackIndex <= 0) {
    return fallbackPreviewHexes[0]
  }

  if (fallbackIndex === 1) {
    return fallbackPreviewHexes[1]
  }

  return fallbackPreviewHexes[2]
}

function resolveSemanticPreviewHex(label: string, fallbackIndex: number): string {
  const trimmed = label.trim()

  if (!trimmed) {
    return getFallbackPreviewHex(fallbackIndex)
  }

  if (/^#(?:[\dA-F]{3}){1,2}$/i.test(trimmed)) {
    return trimmed
  }

  const normalized = trimmed.toLowerCase()
  const matchedPreset = semanticPreviewColorPresets.find((preset) =>
    preset.keywords.some((keyword) => normalized.includes(keyword)),
  )

  return matchedPreset?.hex ?? getFallbackPreviewHex(fallbackIndex)
}

function buildSamplingPreviewSwatches(record: SamplingRecordDto): SamplingPreviewSwatch[] {
  const seen = new Set<string>()
  const candidates = [
    { slot: '主色', label: record.primaryColorSummary ?? '' },
    { slot: '次色', label: record.secondaryColorSummary ?? '' },
    { slot: '点缀', label: record.accentColorSummary ?? '' },
    ...record.colorSummary.map((label) => ({ slot: '综合色', label })),
  ]

  const swatches: SamplingPreviewSwatch[] = []

  for (const candidate of candidates) {
    const label = candidate.label.trim()

    if (!label || seen.has(label)) {
      continue
    }

    seen.add(label)
    swatches.push({
      hex: resolveSemanticPreviewHex(label, swatches.length),
      label,
      slot: candidate.slot,
    })

    if (swatches.length === 3) {
      break
    }
  }

  return swatches
}

function SamplingSection({
  actions,
  children,
  eyebrow,
  hint,
  title,
  tone = 'paper',
}: {
  actions?: ReactNode
  children: ReactNode
  eyebrow?: string
  hint?: string
  title: string
  tone?: 'hero' | 'paper' | 'soft'
}): ReactElement {
  return (
    <Card
      className={cn(
        'paper-card overflow-hidden rounded-[24px] shadow-[0_18px_40px_-30px_rgba(26,26,26,0.28)]',
        tone === 'hero' &&
          'bg-[linear-gradient(140deg,rgba(255,255,255,0.98),rgba(232,216,211,0.58),rgba(93,99,122,0.08))]',
        tone === 'soft' && 'bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,243,242,0.92))]',
        tone === 'paper' && 'bg-white',
      )}
    >
      <CardContent className="p-0">
        <div className="border-b border-[var(--dp-border-subtle)] px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className={cn(eyebrow || hint ? 'space-y-2' : 'space-y-0')}>
              {eyebrow ? <p className="label-caps text-muted-foreground">{eyebrow}</p> : null}
              <div className={cn(hint ? 'space-y-1' : 'space-y-0')}>
                <h2 className="display-font text-[clamp(1.5rem,2vw,2.4rem)] leading-none tracking-[-0.04em] text-foreground">
                  {title}
                </h2>
                {hint ? <p className="max-w-[68ch] text-sm leading-6 text-muted-foreground">{hint}</p> : null}
              </div>
            </div>

            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">{children}</div>
      </CardContent>
    </Card>
  )
}

function MetricTile({ hint, label, value }: { hint?: string; label: string; value: string }): ReactElement {
  return (
    <div className="rounded-[18px] border border-[var(--dp-border-hairline)] bg-white/78 p-4 backdrop-blur-sm">
      <p className="label-caps text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function FieldBlock({ children, hint, label }: { children: ReactNode; hint?: string; label: string }): ReactElement {
  return (
    <div className={fieldShellClassName}>
      <div className="space-y-1">
        <p className={labelClassName}>{label}</p>
        {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}

function ModalHeader({ description, onClose, title }: { description: string; onClose: () => void; title: string }): ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--dp-border-subtle)] px-6 py-5">
      <div className="space-y-2">
        <p className="label-caps text-muted-foreground">Sampling Assistant</p>
        <div className="space-y-1">
          <h2 className="display-font text-[1.75rem] leading-none tracking-[-0.03em] text-foreground">{title}</h2>
          <p className="max-w-[56ch] text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>

      <button className="text-muted-foreground transition hover:text-foreground" onClick={onClose} type="button">
        <X className="size-5" />
      </button>
    </div>
  )
}

function SamplingColorPreview({ record }: { record: SamplingRecordDto }): ReactElement | null {
  const swatches = buildSamplingPreviewSwatches(record)
  const summaryTokens = record.colorSummary.filter((item) => item.trim()).slice(0, 4)

  if (swatches.length === 0) {
    return null
  }

  return (
    <div className="rounded-[20px] border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className={labelClassName}>近似色盘预览</p>
          <p className="text-sm leading-6 text-muted-foreground">
            根据当前候选的主色、次色、点缀色与综合色摘要推导，用来先看方向；最终 palette 以后续正式入库为准。
          </p>
        </div>
        <SamplingBadge tone="soft">语义预览</SamplingBadge>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {swatches.map((swatch, index) => (
          <div key={`${record.samplingId}-${swatch.slot}-${index}`} className="overflow-hidden rounded-[18px] border border-[var(--dp-border-subtle)] bg-white">
            <div className="h-24" style={{ backgroundColor: swatch.hex }} />
            <div className="space-y-2 p-4">
              <p className="label-caps text-muted-foreground">{swatch.slot}</p>
              <p className="text-sm font-semibold text-foreground">{swatch.label}</p>
              <p className="text-xs text-muted-foreground">{swatch.hex.toUpperCase()}</p>
            </div>
          </div>
        ))}
      </div>

      {summaryTokens.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {summaryTokens.map((item) => (
            <SamplingBadge key={`${record.samplingId}-${item}`} tone="soft">
              {item}
            </SamplingBadge>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function buildSamplingEvidenceTimeline(record: SamplingRecordDto): SamplingEvidenceTimelineItem[] {
  return [
    {
      detail: `${getSamplingChannelTypeLabel(record.channelType)} / ${record.platform || '待补平台'}`,
      title: '来源入口',
    },
    {
      detail: record.observedAt || '待补观察日期',
      title: '观察时间',
    },
    {
      detail: record.sourceUrl || '待补可回溯链接',
      title: '回溯链接',
    },
    {
      detail: record.marketSignals || '待补市场信号',
      title: '市场判断',
    },
    {
      detail: record.notes || '待补审阅备注',
      title: '审阅备注',
    },
  ]
}

function SamplingEvidenceTimeline({ record }: { record: SamplingRecordDto }): ReactElement {
  const items = buildSamplingEvidenceTimeline(record)

  return (
    <div className="rounded-[22px] border border-[var(--dp-border-subtle)] bg-white p-5 shadow-[0_20px_32px_-28px_rgba(26,26,26,0.28)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={labelClassName}>证据时间线</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">按审阅顺序把当前记录的证据压成一列，方便快速判断这条来源值不值得留下。</p>
        </div>
        <SamplingBadge tone="soft">{record.brandName || '待补品牌'}</SamplingBadge>
      </div>

      <div className="mt-5 space-y-4">
        {items.map((item, index) => (
          <div key={`${record.samplingId}-${item.title}`} className="grid grid-cols-[20px_minmax(0,1fr)] gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1 size-3 rounded-full bg-[var(--dp-fill-inverse)]" />
              {index < items.length - 1 ? <span className="mt-2 h-full w-px bg-[var(--dp-border-subtle)]" /> : null}
            </div>
            <div className="rounded-[18px] border border-[var(--dp-border-hairline)] bg-[var(--dp-surface-soft)] px-4 py-3">
              <p className="label-caps text-muted-foreground">{item.title}</p>
              <p className="mt-1 break-all text-sm leading-6 text-foreground">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SamplingBatchSettingsModal({
  draft,
  isDeleting,
  isOpen,
  onClose,
  onDeleteBatch,
  onDraftBatchFieldChange,
  onDraftBatchStatusChange,
  onDraftSourceWhitelistToggle,
  onDraftThemeKeysChange,
}: {
  draft: NonNullable<ReturnType<typeof useSamplingBatchesPageViewModel>['draft']>
  isDeleting: boolean
  isOpen: boolean
  onClose: () => void
  onDeleteBatch: () => Promise<void>
  onDraftBatchFieldChange: ReturnType<typeof useSamplingBatchesPageViewModel>['onDraftBatchFieldChange']
  onDraftBatchStatusChange: ReturnType<typeof useSamplingBatchesPageViewModel>['onDraftBatchStatusChange']
  onDraftSourceWhitelistToggle: ReturnType<typeof useSamplingBatchesPageViewModel>['onDraftSourceWhitelistToggle']
  onDraftThemeKeysChange: ReturnType<typeof useSamplingBatchesPageViewModel>['onDraftThemeKeysChange']
}): ReactElement {
  return (
    <WorkbenchModal isOpen={isOpen} onClose={onClose} panelClassName="max-w-[760px] rounded-[24px]">
      <ModalHeader
        description="批次级字段不需要常驻在主界面里。需要时打开这里，改完后回到主界面点“保存批次”。"
        onClose={onClose}
        title="批次设置"
      />

      <div className="space-y-5 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldBlock hint="建议沿用场景 + 批次中文名。" label="批次标题">
            <input
              className={inputClassName}
              onChange={(event) => onDraftBatchFieldChange('titleZh', event.target.value)}
              value={draft.batch.titleZh}
            />
          </FieldBlock>

          <FieldBlock hint="例如：通勤日常 / 节假日 / 约会场景。" label="场景标识">
            <input
              className={inputClassName}
              onChange={(event) => onDraftBatchFieldChange('occasionId', event.target.value)}
              value={draft.batch.occasionId}
            />
          </FieldBlock>

          <FieldBlock hint="批次整体准备好后再推进状态。" label="批次状态">
            <select
              className={inputClassName}
              onChange={(event) => onDraftBatchStatusChange(event.target.value as typeof draft.batch.status)}
              value={draft.batch.status}
            >
              {samplingBatchStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldBlock>

          <FieldBlock hint="记录里的主题键必须来自这里。" label="子主题列表">
            <input
              className={inputClassName}
              onChange={(event) => onDraftThemeKeysChange(event.target.value)}
              value={draft.batch.themeKeys.join(', ')}
            />
          </FieldBlock>
        </div>

        <FieldBlock hint="记录里的渠道必须从这里选择。" label="来源白名单">
          <div className="flex flex-wrap gap-2">
            {samplingChannelTypeOptions.map((option) => {
              const isChecked = draft.batch.sourceWhitelistIds.includes(option.value)

              return (
                <label
                  key={option.value}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition',
                    isChecked
                      ? 'border-[var(--dp-fill-inverse)] bg-[var(--dp-fill-inverse)] text-[var(--dp-text-on-inverse)]'
                      : 'border-[var(--dp-border-subtle)] bg-white text-foreground',
                  )}
                >
                  <input
                    checked={isChecked}
                    className="size-4 accent-[var(--dp-fill-inverse)]"
                    onChange={() => onDraftSourceWhitelistToggle(option.value)}
                    type="checkbox"
                  />
                  <span>{option.label}</span>
                </label>
              )
            })}
          </div>
        </FieldBlock>

        <FieldBlock hint="这里写这批次的采样策略与提醒。" label="批次备注">
          <textarea
            className={textareaClassName}
            onChange={(event) => onDraftBatchFieldChange('notes', event.target.value)}
            value={draft.batch.notes ?? ''}
          />
        </FieldBlock>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--dp-border-subtle)] px-6 py-5">
        <Button disabled={isDeleting} onClick={() => void onDeleteBatch()} variant="ghost">
          <Trash2 className="size-4" />
          {isDeleting ? '删除中' : '删除批次'}
        </Button>
        <div className="flex items-center gap-3">
          <Button onClick={onClose} variant="ghost">关闭</Button>
          <Button onClick={onClose} variant="primary">继续编辑</Button>
        </div>
      </div>
    </WorkbenchModal>
  )
}

type SamplingOverviewFilter = 'all' | 'complete' | 'pending' | 'rejected' | 'reviewed'

interface SamplingBatchUiState {
  batchId: string | null
  isDuplicateCheckEnabled: boolean
  isGenerateConfirmOpen: boolean
  isReviewDrawerOpen: boolean
  overviewFilter: SamplingOverviewFilter
}

function buildSamplingBatchUiState(batchId: string | null): SamplingBatchUiState {
  return {
    batchId,
    isDuplicateCheckEnabled: false,
    isGenerateConfirmOpen: false,
    isReviewDrawerOpen: false,
    overviewFilter: 'all',
  }
}

interface SamplingPaletteDuplicateInfo {
  duplicateOfSamplingId: string
}

interface SamplingPaletteCluster {
  brandCount: number
  brandNames: string[]
  completeCount: number
  id: string
  pendingCount: number
  records: SamplingRecordDto[]
  rejectedCount: number
  representative: SamplingRecordDto
  reviewedCount: number
  sourceCount: number
  themeLabels: string[]
}

function normalizeSamplingClusterToken(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

function buildSamplingPaletteClusterId(record: SamplingRecordDto): string {
  const tokens = [
    normalizeSamplingClusterToken(record.primaryColorSummary),
    normalizeSamplingClusterToken(record.secondaryColorSummary),
    normalizeSamplingClusterToken(record.accentColorSummary),
    ...record.colorSummary.map((item) => normalizeSamplingClusterToken(item)),
  ].filter(Boolean)

  if (tokens.length === 0) {
    return `record:${record.samplingId}`
  }

  return tokens.slice(0, 5).join('|')
}

function buildSamplingPaletteClusters(records: SamplingRecordDto[]): SamplingPaletteCluster[] {
  const clusterMap = new Map<string, SamplingRecordDto[]>()

  for (const record of records) {
    const clusterId = buildSamplingPaletteClusterId(record)
    const nextItems = clusterMap.get(clusterId) ?? []

    nextItems.push(record)
    clusterMap.set(clusterId, nextItems)
  }

  return Array.from(clusterMap.entries()).map(([id, clusterRecords]) => {
    const representative = clusterRecords.find((item) => item.digestionStatus === 'sampled')
      ?? clusterRecords.find((item) => !isSamplingRecordComplete(item))
      ?? clusterRecords[0]!

    return {
      brandCount: new Set(clusterRecords.map((item) => item.brandName.trim()).filter(Boolean)).size,
      brandNames: Array.from(new Set(clusterRecords.map((item) => item.brandName.trim()).filter(Boolean))),
      completeCount: clusterRecords.filter((item) => isSamplingRecordComplete(item)).length,
      id,
      pendingCount: clusterRecords.filter((item) => item.digestionStatus === 'sampled').length,
      records: clusterRecords,
      rejectedCount: clusterRecords.filter((item) => item.digestionStatus === 'rejected').length,
      representative,
      reviewedCount: clusterRecords.filter((item) => isReviewedSamplingRecord(item)).length,
      sourceCount: clusterRecords.length,
      themeLabels: Array.from(new Set(clusterRecords.map((item) => (item.themeLabelZh || item.themeKey || '待补主题').trim()).filter(Boolean))),
    }
  }).sort((left, right) => {
    const leftScore = (left.pendingCount > 0 ? -2 : 0) + left.rejectedCount
    const rightScore = (right.pendingCount > 0 ? -2 : 0) + right.rejectedCount

    return leftScore - rightScore
  })
}

function buildSamplingPaletteDuplicateSignature(cluster: SamplingPaletteCluster): string | null {
  const tokens = buildSamplingPreviewSwatches(cluster.representative)
    .map((swatch) => swatch.hex.trim().toLowerCase())
    .filter(Boolean)

  if (tokens.length === 0) {
    return null
  }

  return tokens.join('|')
}

function buildSamplingPaletteDuplicateMap(
  clusters: SamplingPaletteCluster[],
): Map<string, SamplingPaletteDuplicateInfo> {
  const firstSamplingIdBySignature = new Map<string, string>()
  const duplicateMap = new Map<string, SamplingPaletteDuplicateInfo>()

  for (const cluster of clusters) {
    const signature = buildSamplingPaletteDuplicateSignature(cluster)

    if (!signature) {
      continue
    }

    const firstSamplingId = firstSamplingIdBySignature.get(signature)

    if (firstSamplingId) {
      duplicateMap.set(cluster.id, {
        duplicateOfSamplingId: firstSamplingId,
      })
      continue
    }

    firstSamplingIdBySignature.set(signature, cluster.representative.samplingId)
  }

  return duplicateMap
}

function isReviewedSamplingRecord(record: SamplingRecordDto): boolean {
  return record.digestionStatus === 'clustered' || record.digestionStatus === 'shortlisted' || record.digestionStatus === 'published'
}

function matchesSamplingOverviewFilter(cluster: SamplingPaletteCluster, filter: SamplingOverviewFilter): boolean {
  if (filter === 'all') {
    return true
  }

  if (filter === 'pending') {
    return cluster.pendingCount > 0
  }

  if (filter === 'reviewed') {
    return cluster.reviewedCount > 0 && cluster.pendingCount === 0
  }

  if (filter === 'rejected') {
    return cluster.rejectedCount === cluster.sourceCount
  }

  return cluster.completeCount === cluster.sourceCount
}

function SamplingOverviewFilterButton({
  count,
  isActive,
  label,
  onClick,
}: {
  count: number
  isActive: boolean
  label: string
  onClick: () => void
}): ReactElement {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition',
        isActive
          ? 'border-[var(--dp-fill-inverse)] bg-[var(--dp-fill-inverse)] text-[var(--dp-text-on-inverse)]'
          : 'border-[var(--dp-border-subtle)] bg-white text-foreground hover:border-[var(--dp-fill-inverse)]',
      )}
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      <span className={cn('rounded-full px-2 py-0.5 text-xs', isActive ? 'bg-white/16' : 'bg-[var(--dp-surface-soft)] text-muted-foreground')}>
        {count}
      </span>
    </button>
  )
}

function SamplingBatchStripCard({
  card,
  isSelected,
  onSelect,
}: {
  card: NonNullable<ReturnType<typeof useSamplingBatchesPageViewModel>['model']>['cards'][number]
  isSelected: boolean
  onSelect: () => void
}): ReactElement {
  return (
    <button className="block min-w-[210px] text-left" onClick={onSelect} type="button">
      <div
        className={cn(
          'rounded-[18px] border bg-white px-3.5 py-3 transition-all duration-300',
          isSelected
            ? 'border-[var(--dp-fill-inverse)] shadow-[0_18px_34px_-28px_rgba(26,26,26,0.32)]'
            : 'border-[var(--dp-border-subtle)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-28px_rgba(26,26,26,0.28)]',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="label-caps text-muted-foreground">{card.id}</p>
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{card.titleZh}</h3>
          </div>
          <SamplingBadge tone={isSelected ? 'dark' : 'soft'}>{card.statusLabel}</SamplingBadge>
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">{card.recordCountLabel} · {card.completedLabel}</p>
      </div>
    </button>
  )
}

function getSamplingClusterStatus(cluster: SamplingPaletteCluster): {
  label: string
  tone: SamplingBadgeProps['tone']
} {
  if (cluster.rejectedCount === cluster.sourceCount) {
    return {
      label: '已驳回',
      tone: 'dark',
    }
  }

  if (cluster.pendingCount > 0) {
    return {
      label: '待审',
      tone: 'default',
    }
  }

  return {
    label: '已通过',
    tone: 'ok',
  }
}

function SamplingPaletteWallCard({
  cluster,
  duplicateInfo,
  isDuplicateCheckEnabled,
  isSelected,
  onApprove,
  onReject,
  onSelect,
}: {
  cluster: SamplingPaletteCluster
  duplicateInfo?: SamplingPaletteDuplicateInfo
  isDuplicateCheckEnabled: boolean
  isSelected: boolean
  onApprove: () => Promise<void>
  onReject: () => Promise<void>
  onSelect: () => void
}): ReactElement {
  const record = cluster.representative
  const isDuplicate = Boolean(isDuplicateCheckEnabled && duplicateInfo)
  const reviewStatus = getSamplingClusterStatus(cluster)
  const swatches = buildSamplingPreviewSwatches(record)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <div
      className={cn(
        'rounded-[24px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,243,242,0.88))] p-5 shadow-[0_18px_36px_-28px_rgba(26,26,26,0.28)] transition-all duration-300',
        isDuplicate && 'border-amber-300 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(247,243,242,0.9))]',
        isSelected
          ? 'border-[var(--dp-fill-inverse)] shadow-[0_24px_44px_-28px_rgba(26,26,26,0.36)]'
          : 'border-[var(--dp-border-subtle)] hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-28px_rgba(26,26,26,0.32)]',
      )}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="label-caps text-muted-foreground">{cluster.themeLabels.slice(0, 2).join(' / ')}</p>
          <SamplingBadge tone="soft">ID · {record.samplingId}</SamplingBadge>
          <h3 className="text-lg font-semibold text-foreground">{cluster.brandNames[0] || '待补品牌'}</h3>
        </div>

        <div className="flex flex-col items-end gap-2">
          <SamplingBadge tone={reviewStatus.tone}>{reviewStatus.label}</SamplingBadge>
          {isDuplicate && duplicateInfo ? (
            <>
              <SamplingBadge tone="dark">标记重复</SamplingBadge>
              <SamplingBadge tone="soft">重复于 {duplicateInfo.duplicateOfSamplingId}</SamplingBadge>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {swatches.length > 0 ? (
          swatches.map((swatch) => (
            <div key={`${record.samplingId}-${swatch.slot}`} className="overflow-hidden rounded-[18px] border border-[var(--dp-border-subtle)] bg-white">
              <div className="h-24" style={{ backgroundColor: swatch.hex }} />
              <div className="space-y-1 p-3">
                <p className="label-caps text-muted-foreground">{swatch.slot}</p>
                <p className="text-sm font-semibold text-foreground">{swatch.label}</p>
                <p className="text-xs text-muted-foreground">{swatch.hex.toUpperCase()}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="sm:col-span-3 rounded-[18px] border border-dashed border-[var(--dp-border-subtle)] bg-white/80 px-4 py-6 text-sm leading-6 text-muted-foreground">
            当前还没有足够的颜色摘要，先补主色、次色或综合色摘要。
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          disabled={cluster.sourceCount === 0}
          onClick={(event) => {
            event.stopPropagation()
            void onApprove()
          }}
          size="sm"
          variant={isSelected ? 'primary' : 'ghost'}
        >
          <CheckCheck className="size-4" />
          通过
        </Button>
        <Button
          disabled={cluster.sourceCount === 0}
          onClick={(event) => {
            event.stopPropagation()
            void onReject()
          }}
          size="sm"
          variant="ghost"
        >
          驳回
        </Button>
      </div>
    </div>
  )
}

type WorkbenchTab = 'collect' | 'review'

const WORKBENCH_TABS: Array<{ key: WorkbenchTab; label: string; icon: ReactElement }> = [
  { key: 'collect', label: '采集', icon: <Sparkles size={15} /> },
  { key: 'review', label: '审阅', icon: <Layers3 size={15} /> },
]

export function SamplingBatchesPage(): ReactElement {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('review')
  const [advancedRecordId, setAdvancedRecordId] = useState<string | null>(null)
  const [batchUiStateDraft, setBatchUiStateDraft] = useState<SamplingBatchUiState>(() => buildSamplingBatchUiState(null))
  const [isBatchSettingsOpen, setIsBatchSettingsOpen] = useState(false)

  // Collection tab state
  const [collectionMode, setCollectionMode] = useState<'llm' | 'image'>('llm')
  const [isCollecting, setIsCollecting] = useState(false)
  const [collectErrorMessage, setCollectErrorMessage] = useState('')
  const [collectSuccessMessage, setCollectSuccessMessage] = useState('')
  const [collectRun, setCollectRun] = useState<SamplingRunDto | null>(null)
  const [collectRunEvents, setCollectRunEvents] = useState<SamplingRunEventDto[]>([])

  const {
    draft,
    errorMessage,
    isDeleting,
    isLoading,
    isSaving,
    model,
    onAddRecord,
    onDeleteBatch,
    onDeleteRecord,
    onDraftBatchFieldChange,
    onDraftBatchStatusChange,
    onDraftRecordArrayFieldChange,
    onDraftRecordFieldChange,
    onDraftSourceWhitelistToggle,
    onDraftThemeKeysChange,
    onRefresh,
    onReviewRecord,
    onReviewRecords,
    onSave,
    onSelectBatch,
    onSelectRecord,
    saveMessage,
    samplingRun,
    samplingRunEvents,
    selectedBatchId,
    selectedRecord,
    selectedRecordId,
    validationMessages,
  } = useSamplingBatchesPageViewModel()

  const batchUiState = batchUiStateDraft.batchId === selectedBatchId
    ? batchUiStateDraft
    : buildSamplingBatchUiState(selectedBatchId)
  const isAdvancedOpen = Boolean(selectedRecordId && advancedRecordId === selectedRecordId)
  const isDuplicateCheckEnabled = batchUiState.isDuplicateCheckEnabled
  const isReviewDrawerOpen = batchUiState.isReviewDrawerOpen
  const overviewFilter = batchUiState.overviewFilter

  function updateBatchUiState(updater: (current: SamplingBatchUiState) => SamplingBatchUiState): void {
    setBatchUiStateDraft((current) =>
      updater(current.batchId === selectedBatchId ? current : buildSamplingBatchUiState(selectedBatchId)),
    )
  }

  const allClusters = buildSamplingPaletteClusters(draft?.items ?? [])
  const overviewClusters = allClusters.filter((cluster) => matchesSamplingOverviewFilter(cluster, overviewFilter))
  const duplicateInfoByClusterId = buildSamplingPaletteDuplicateMap(overviewClusters)
  const pendingClusters = allClusters.filter((cluster) => cluster.pendingCount > 0)
  const reviewedClusters = allClusters.filter((cluster) => cluster.reviewedCount > 0 && cluster.pendingCount === 0)
  const rejectedClusters = allClusters.filter((cluster) => cluster.rejectedCount === cluster.sourceCount)
  const completeClusters = allClusters.filter((cluster) => cluster.completeCount === cluster.sourceCount)
  const selectedCluster = allClusters.find((cluster) => cluster.records.some((record) => record.samplingId === selectedRecordId)) ?? null
  const visibleUniqueCount = draft?.summary.visibleUniqueCount ?? 0
  const visibleDuplicateCount = draft ? Math.max(draft.summary.recordCount - visibleUniqueCount, 0) : 0
  const visibleUniqueRate = draft && draft.summary.recordCount > 0
    ? Math.round((visibleUniqueCount / draft.summary.recordCount) * 100)
    : 0

  function handleSelectRecord(samplingId: string): void {
    onSelectRecord(samplingId)
    setAdvancedRecordId(null)
  }

  function handleSelectBatch(batchId: string): void {
    onSelectBatch(batchId)
    setAdvancedRecordId(null)
  }

  function handleCloseReviewDrawer(): void {
    updateBatchUiState((current) => ({
      ...current,
      isReviewDrawerOpen: false,
    }))
  }

  function openReviewDrawer(samplingId: string): void {
    handleSelectRecord(samplingId)
    updateBatchUiState((current) => ({
      ...current,
      isReviewDrawerOpen: true,
    }))
  }

  // Collection tab handlers
  const handleLlmGenerate = useCallback(async (params: LlmBatchGenerateParams) => {
    setIsCollecting(true)
    setCollectErrorMessage('')
    setCollectSuccessMessage('')
    setCollectRunEvents([])

    try {
      const run = await createSamplingRun({
        batchId: '',
        operationType: 'llm-batch-generate',
        llmBatchGenerate: params,
      })
      setCollectRun(run)

      const seenIds = new Set<string>()
      const eventSource = subscribeToSamplingRunStream(run.runId, {
        onEvent: (event) => {
          if (seenIds.has(event.eventId)) return
          seenIds.add(event.eventId)
          setCollectRunEvents((prev) => [...prev, event])
          setCollectRun((prev) => prev ? {
            ...prev,
            status: event.type === 'run-finished' ? (event.level === 'error' ? 'failed' : 'succeeded') : prev.status,
            currentStage: event.stage ?? prev.currentStage,
            progressPercent: event.progressPercent ?? prev.progressPercent,
            errorCount: prev.errorCount + (event.level === 'error' ? 1 : 0),
            warningCount: prev.warningCount + (event.level === 'warning' ? 1 : 0),
            finishedAt: event.type === 'run-finished' ? event.createdAt : prev.finishedAt,
          } : prev)

          if (event.type === 'run-finished') {
            eventSource.close()
            const batchId = (event.metadata as Record<string, unknown>)?.batchId as string | undefined
            void getSamplingRun(run.runId).then((finalRun) => {
              setCollectRun(finalRun)
              setIsCollecting(false)
              if (event.level === 'error') {
                setCollectErrorMessage(`生成失败: ${event.message}`)
              } else {
                setCollectSuccessMessage('生成完成！')
                void onRefresh()
                setActiveTab('review')
                if (batchId) onSelectBatch(batchId)
              }
            }).catch(() => {
              setIsCollecting(false)
              if (event.level !== 'error') {
                setCollectSuccessMessage('生成完成！')
                void onRefresh()
                setActiveTab('review')
              }
            })
          }
        },
        onError: () => {
          eventSource.close()
          setIsCollecting(false)
          setCollectErrorMessage('连接中断，请重试。')
        },
      })
    } catch (error) {
      setIsCollecting(false)
      setCollectErrorMessage(error instanceof Error ? error.message : '启动生成失败')
    }
  }, [onRefresh, onSelectBatch])

  const handleImageExtractUrls = useCallback(async (params: { imageUrls: string[]; occasionId: string; themeKey: string; themeLabelZh: string }) => {
    setIsCollecting(true)
    setCollectErrorMessage('')
    setCollectSuccessMessage('')
    try {
      const result = await extractColorsFromUrls(params)
      setCollectSuccessMessage(`提取完成！共 ${result.records.length} 条记录。`)
      setIsCollecting(false)
      void onRefresh()
      setActiveTab('review')
      onSelectBatch(result.batchId)
    } catch (error) {
      setIsCollecting(false)
      setCollectErrorMessage(error instanceof Error ? error.message : '图片取色失败')
    }
  }, [onRefresh, onSelectBatch])

  const handleImageExtractFiles = useCallback(async (params: { files: File[]; occasionId: string; themeKey: string; themeLabelZh: string }) => {
    setIsCollecting(true)
    setCollectErrorMessage('')
    setCollectSuccessMessage('')
    try {
      const result = await extractColorsFromFiles(params)
      setCollectSuccessMessage(`提取完成！共 ${result.records.length} 条记录。`)
      setIsCollecting(false)
      void onRefresh()
      setActiveTab('review')
      onSelectBatch(result.batchId)
    } catch (error) {
      setIsCollecting(false)
      setCollectErrorMessage(error instanceof Error ? error.message : '图片取色失败')
    }
  }, [onRefresh, onSelectBatch])

  async function handleReviewCluster(
    cluster: SamplingPaletteCluster,
    status: SamplingRecordDto['digestionStatus'],
  ): Promise<void> {
    await onReviewRecords(
      cluster.records.map((record) => record.samplingId),
      status,
    )
    handleCloseReviewDrawer()
  }

  return (
    <div className="space-y-6 pb-10">
      <WorkbenchPageHeader
        actions={
          activeTab === 'review' ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void onRefresh()} size="sm" variant="ghost">
                <RefreshCcw className="size-4" />
                刷新
              </Button>
              <Button disabled={!draft} onClick={() => setIsBatchSettingsOpen(true)} size="sm" variant="ghost">
                <Layers3 className="size-4" />
                批次设置
              </Button>
              <Button disabled={!draft || isSaving} onClick={() => void onSave()} size="sm" variant="ghost">
                <Save className="size-4" />
                {isSaving ? '保存中' : '保存批次'}
              </Button>
            </div>
          ) : undefined
        }
        archivedLabel={model?.archivedLabel ?? '0 个已归档批次'}
        description="LLM 生成配色候选、图片取色与批次审阅"
        hideSearch
        onSearchChange={() => {}}
        searchPlaceholder="当前版本暂不支持搜索"
        searchValue=""
        title="采样工作台"
        totalLabel={model?.totalLabel ?? '读取中'}
        updatedAtLabel={model?.updatedAtLabel ?? '等待返回'}
      />

      {/* Tab bar */}
      <div className="flex gap-1 rounded-full bg-[var(--dp-surface-soft)] p-1">
        {WORKBENCH_TABS.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition',
              activeTab === tab.key
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Collection tab */}
      {activeTab === 'collect' && (
        <div className="space-y-4">
          {/* Collection mode toggle */}
          <div className="flex gap-1 rounded-full bg-[var(--dp-surface-soft)] p-1 w-fit">
            <button
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition',
                collectionMode === 'llm'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              disabled={isCollecting}
              onClick={() => setCollectionMode('llm')}
              type="button"
            >
              <Sparkles size={14} />
              LLM 批量生成
            </button>
            <button
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition',
                collectionMode === 'image'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              disabled={isCollecting}
              onClick={() => setCollectionMode('image')}
              type="button"
            >
              <ImageIcon size={14} />
              图片取色
            </button>
          </div>

          {/* Error / Success messages */}
          {collectErrorMessage && (
            <Card className="border-red-200 bg-red-50/80 text-red-700">
              <CardContent className="p-4 text-sm">{collectErrorMessage}</CardContent>
            </Card>
          )}
          {collectSuccessMessage && (
            <Card className="border-emerald-200 bg-emerald-50/80 text-emerald-700">
              <CardContent className="p-4 text-sm">{collectSuccessMessage}</CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            {/* Left: form */}
            <div className="rounded-xl border border-[var(--dp-border-subtle)] bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                {collectionMode === 'llm' ? '生成参数' : '图片上传'}
              </h3>
              {collectionMode === 'llm' && (
                <LlmGenerationForm isDisabled={isCollecting} onSubmit={handleLlmGenerate} />
              )}
              {collectionMode === 'image' && (
                <ImageExtractionForm
                  isDisabled={isCollecting}
                  onSubmitUrls={handleImageExtractUrls}
                  onSubmitFiles={handleImageExtractFiles}
                />
              )}
            </div>

            {/* Right: progress */}
            <div className="rounded-xl border border-[var(--dp-border-subtle)] bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">生成进度</h3>
              {!collectRun && !isCollecting && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles size={48} className="mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">填写参数后点击「开始生成」</p>
                </div>
              )}
              {(collectRun || isCollecting) && (
                <CollectProgressPanel events={collectRunEvents} run={collectRun} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review tab */}
      {activeTab === 'review' && draft ? (
      <div className="space-y-6">
          <SamplingBatchSettingsModal
            draft={draft}
            isDeleting={isDeleting}
            isOpen={isBatchSettingsOpen}
            onClose={() => setIsBatchSettingsOpen(false)}
            onDeleteBatch={onDeleteBatch}
            onDraftBatchFieldChange={onDraftBatchFieldChange}
            onDraftBatchStatusChange={onDraftBatchStatusChange}
            onDraftSourceWhitelistToggle={onDraftSourceWhitelistToggle}
            onDraftThemeKeysChange={onDraftThemeKeysChange}
          />

      {errorMessage ? (
        <Card className="border-red-200 bg-red-50/80 text-red-700">
          <CardContent className="p-5 text-sm leading-6">{errorMessage}</CardContent>
        </Card>
      ) : null}

      {saveMessage ? (
        <Card className="border-emerald-200 bg-emerald-50/80 text-emerald-700">
          <CardContent className="p-5 text-sm leading-6">{saveMessage}</CardContent>
        </Card>
      ) : null}

      {validationMessages.length > 0 ? (
        <Card className="border-[var(--dp-border-subtle)] bg-white/78 text-foreground">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm leading-6">
            <p>当前批次还有 {validationMessages.length} 条待补项，先补当前这条的必要字段即可。</p>
            <SamplingBadge tone="soft">必要字段优先</SamplingBadge>
          </CardContent>
        </Card>
      ) : null}

          <div className="space-y-6">
            <SamplingSection title="批次" tone="soft">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {(model?.cards ?? []).map((card) => (
                  <SamplingBatchStripCard
                    key={card.id}
                    card={card}
                    isSelected={selectedBatchId === card.id}
                    onSelect={() => handleSelectBatch(card.id)}
                  />
                ))}

                {isLoading && !model
                  ? Array.from({ length: 2 }).map((_, index) => (
                      <Card key={index} className="min-h-[96px] min-w-[210px] animate-pulse bg-white/70" />
                    ))
                  : null}
              </div>
            </SamplingSection>

            <div className="space-y-6">
              {draft && model?.detail ? (
                <SamplingSection
                  actions={
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={!draft || allClusters.length === 0}
                        onClick={() => updateBatchUiState((current) => ({
                          ...current,
                          isDuplicateCheckEnabled: !current.isDuplicateCheckEnabled,
                        }))}
                        variant={isDuplicateCheckEnabled ? 'outline' : 'ghost'}
                      >
                        {isDuplicateCheckEnabled ? '隐藏重复标记' : '查重'}
                      </Button>
                    </div>
                  }
                  title="色盘总览"
                  tone="soft"
                >
                  <div className="space-y-5">
                    <div className="grid gap-3 lg:grid-cols-2">
                      <MetricTile
                        hint={visibleDuplicateCount > 0 ? `还有 ${visibleDuplicateCount} 条会折叠成重复显示。` : '当前没有可视重复。'}
                        label="可视唯一率"
                        value={`${visibleUniqueCount} / ${draft.summary.recordCount} · ${visibleUniqueRate}%`}
                      />
                      <MetricTile
                        hint={'通过 LLM 批量生成或图片取色来扩充批次。'}
                        label="记录总数"
                        value={`${draft.summary.recordCount} 条`}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <SamplingOverviewFilterButton count={allClusters.length} isActive={overviewFilter === 'all'} label="全部" onClick={() => updateBatchUiState((current) => ({ ...current, overviewFilter: 'all' }))} />
                      <SamplingOverviewFilterButton count={pendingClusters.length} isActive={overviewFilter === 'pending'} label="待审" onClick={() => updateBatchUiState((current) => ({ ...current, overviewFilter: 'pending' }))} />
                      <SamplingOverviewFilterButton count={reviewedClusters.length} isActive={overviewFilter === 'reviewed'} label="已整理" onClick={() => updateBatchUiState((current) => ({ ...current, overviewFilter: 'reviewed' }))} />
                      <SamplingOverviewFilterButton count={rejectedClusters.length} isActive={overviewFilter === 'rejected'} label="已驳回" onClick={() => updateBatchUiState((current) => ({ ...current, overviewFilter: 'rejected' }))} />
                      <SamplingOverviewFilterButton count={completeClusters.length} isActive={overviewFilter === 'complete'} label="来源完整" onClick={() => updateBatchUiState((current) => ({ ...current, overviewFilter: 'complete' }))} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                      {overviewClusters.map((cluster) => (
                        <SamplingPaletteWallCard
                          key={cluster.id}
                          cluster={cluster}
                          duplicateInfo={duplicateInfoByClusterId.get(cluster.id)}
                          isDuplicateCheckEnabled={isDuplicateCheckEnabled}
                          isSelected={Boolean(isReviewDrawerOpen && selectedCluster && selectedCluster.id === cluster.id)}
                          onApprove={() => handleReviewCluster(cluster, 'clustered')}
                          onReject={() => handleReviewCluster(cluster, 'rejected')}
                          onSelect={() => openReviewDrawer(cluster.representative.samplingId)}
                        />
                      ))}
                    </div>

                    {overviewClusters.length === 0 ? (
                      <div className="rounded-[20px] border border-dashed border-[var(--dp-border-subtle)] bg-white/72 px-5 py-10 text-sm leading-7 text-muted-foreground">
                        当前筛选下没有可展示的色盘，试着切换到其他筛选条件。
                      </div>
                    ) : null}
                  </div>
                </SamplingSection>
              ) : (
                <SamplingSection
                  eyebrow="空状态"
                  hint="先准备一个采样批次文件，页面才会出现完整工作台。"
                  title="当前没有可展示的采样批次"
                >
                  <div className="rounded-[20px] border border-dashed border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-5 py-10 text-sm leading-7 text-muted-foreground">
                    当前没有可展示的采样批次。你可以先创建批次文件，再回到这里录入样本。
                  </div>
                </SamplingSection>
              )}
            </div>
          </div>

          <DetailDrawer isOpen={isReviewDrawerOpen && Boolean(selectedRecord)} onClose={handleCloseReviewDrawer}>
            <div className="flex h-full flex-col bg-[var(--dp-surface-soft)]">
              <div className="border-b border-[var(--dp-border-subtle)] bg-white px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className={labelClassName}>审阅抽屉</p>
                    <h2 className="display-font text-[1.8rem] leading-none tracking-[-0.04em] text-foreground">
                      {selectedCluster ? `${selectedCluster.themeLabels[0] ?? '待补主题'} / ${selectedCluster.sourceCount} 条来源` : '尚未选择色盘'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={onAddRecord} size="sm" variant="ghost">
                      <Plus className="size-4" />
                      补充候选
                    </Button>
                    <button
                      className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--dp-border-subtle)] bg-white text-muted-foreground transition hover:border-[var(--dp-fill-inverse)] hover:text-foreground"
                      onClick={handleCloseReviewDrawer}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                {selectedRecord ? (
                  <>
                    {selectedCluster ? (
                      <div className="space-y-4 rounded-[20px] border border-[var(--dp-border-subtle)] bg-white p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <SamplingBadge tone="dark">当前色盘簇</SamplingBadge>
                          <SamplingBadge tone="soft">{selectedCluster.sourceCount} 条来源</SamplingBadge>
                          <SamplingBadge tone="soft">{selectedCluster.brandCount} 个品牌</SamplingBadge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {selectedCluster.records.map((record) => (
                            <button
                              key={record.samplingId}
                              className={cn(
                                'rounded-[18px] border px-4 py-3 text-left transition',
                                record.samplingId === selectedRecordId
                                  ? 'border-[var(--dp-fill-inverse)] bg-[var(--dp-surface-soft)] shadow-[0_16px_28px_-24px_rgba(26,26,26,0.28)]'
                                  : 'border-[var(--dp-border-subtle)] bg-white hover:border-[var(--dp-fill-inverse)]',
                              )}
                              onClick={() => handleSelectRecord(record.samplingId)}
                              type="button"
                            >
                              <p className="text-sm font-semibold text-foreground">{record.brandName || '待补品牌'}</p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">{record.samplingId}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <SamplingBadge tone="soft">{record.itemCategory || '待补品类'}</SamplingBadge>
                                <SamplingBadge tone={isSamplingRecordComplete(record) ? 'ok' : 'soft'}>
                                  {isSamplingRecordComplete(record) ? '完整' : '待补'}
                                </SamplingBadge>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-start justify-between gap-4 rounded-[20px] border border-[var(--dp-border-hairline)] bg-white p-5">
                      <div className="space-y-3">
                        <p className={labelClassName}>当前记录</p>
                        <div className="space-y-2">
                          <h3 className="display-font text-[1.8rem] leading-none tracking-[-0.04em] text-foreground">
                            {selectedRecord.samplingId}
                          </h3>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {selectedRecord.themeLabelZh || selectedRecord.themeKey || '待补主题'} /{' '}
                            {getSamplingChannelTypeLabel(selectedRecord.channelType)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <SamplingBadge tone={isSamplingRecordComplete(selectedRecord) ? 'ok' : 'soft'}>
                            {isSamplingRecordComplete(selectedRecord) ? '候选信息完整' : '候选信息待补'}
                          </SamplingBadge>
                          <SamplingBadge tone="soft">
                            {getSamplingDigestionStatusLabel(selectedRecord.digestionStatus)}
                          </SamplingBadge>
                          <SamplingBadge tone="soft">{selectedRecord.itemCategory || '待补品类'}</SamplingBadge>
                        </div>
                      </div>

                      <Button onClick={() => onDeleteRecord(selectedRecord.samplingId)} size="sm" variant="ghost">
                        <Trash2 className="size-4" />
                        删除记录
                      </Button>
                    </div>

                    <div className="rounded-[20px] border border-[var(--dp-border-subtle)] bg-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-2">
                          <p className={labelClassName}>主动作</p>
                          <p className="text-sm leading-6 text-muted-foreground">
                            在抽屉里看完证据后，再决定这一条是通过还是驳回。
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={isSaving}
                            onClick={() => void onReviewRecord(selectedRecord.samplingId, 'clustered')}
                            variant="primary"
                          >
                            <CheckCheck className="size-4" />
                            {isSaving ? '提交中' : '审阅通过'}
                          </Button>
                          <Button
                            disabled={isSaving}
                            onClick={() => void onReviewRecord(selectedRecord.samplingId, 'rejected')}
                            variant="ghost"
                          >
                            驳回候选
                          </Button>
                        </div>
                      </div>
                    </div>

                    <SamplingColorPreview record={selectedRecord} />
                    <SamplingEvidenceTimeline record={selectedRecord} />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <FieldBlock hint="只选白名单中的渠道。" label="渠道类型">
                          <select
                            className={inputClassName}
                            onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'channelType', event.target.value)}
                            value={selectedRecord.channelType}
                          >
                            <option value="">未设置</option>
                            {samplingChannelTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FieldBlock>

                        <FieldBlock hint="例如：COS 官网 / 天猫官方旗舰店 / Net-a-Porter。" label="平台">
                          <input
                            className={inputClassName}
                            onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'platform', event.target.value)}
                            placeholder="例如：COS 官网"
                            value={selectedRecord.platform}
                          />
                        </FieldBlock>

                        <FieldBlock hint="优先填写品牌名，不写模糊店铺名。" label="品牌">
                          <input
                            className={inputClassName}
                            onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'brandName', event.target.value)}
                            placeholder="例如：COS"
                            value={selectedRecord.brandName}
                          />
                        </FieldBlock>

                        <FieldBlock hint="优先使用统一品类：blazer / shirt / trench 等。" label="品类">
                          <input
                            className={inputClassName}
                            onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'itemCategory', event.target.value)}
                            placeholder="例如：blazer"
                            value={selectedRecord.itemCategory}
                          />
                        </FieldBlock>

                        <FieldBlock hint="建议用你实际看到页面的日期。" label="观察日期">
                          <input
                            className={inputClassName}
                            onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'observedAt', event.target.value)}
                            type="date"
                            value={selectedRecord.observedAt}
                          />
                        </FieldBlock>

                        <FieldBlock hint="直接贴公开来源链接，后续审核要能打开。" label="来源链接">
                          <input
                            className={inputClassName}
                            onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'sourceUrl', event.target.value)}
                            placeholder="https://..."
                            type="url"
                            value={selectedRecord.sourceUrl}
                          />
                        </FieldBlock>
                      </div>

                      <FieldBlock hint="至少填 1 到 3 个综合色词，逗号分隔。" label="综合色摘要（逗号分隔）">
                        <textarea
                          className={textareaClassName}
                          onChange={(event) =>
                            onDraftRecordArrayFieldChange(selectedRecord.samplingId, 'colorSummary', event.target.value)
                          }
                          placeholder="例如：米白, 雾蓝, 深炭灰"
                          value={stringifyCommaSeparatedValues(selectedRecord.colorSummary)}
                        />
                      </FieldBlock>

                    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--dp-border-subtle)] bg-white px-4 py-4">
                        <div>
                          <p className="label-caps text-muted-foreground">人工修正与补录</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            只有在系统候选缺字段，或你需要补主题、市场信号、候选 palette 等信息时再打开。
                          </p>
                        </div>
                        <Button
                          onClick={() => setAdvancedRecordId((currentValue) =>
                            currentValue === selectedRecordId ? null : (selectedRecordId ?? null),
                          )}
                          size="sm"
                          variant="ghost"
                        >
                          {isAdvancedOpen ? '收起高级字段' : '展开高级字段'}
                        </Button>
                      </div>

                      {isAdvancedOpen ? (
                        <div className="space-y-5 rounded-[22px] border border-[var(--dp-border-subtle)] bg-[rgba(247,243,242,0.65)] p-5">
                          <div className="grid gap-4 xl:grid-cols-2">
                            <FieldBlock hint="建议保留稳定规则，不要随意改前缀。" label="采样记录标识">
                              <input
                                className={inputClassName}
                                onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'samplingId', event.target.value)}
                                value={selectedRecord.samplingId}
                              />
                            </FieldBlock>

                            <FieldBlock hint="记录当前处于采样、聚类、短名单还是已采用。" label="消化状态">
                              <select
                                className={inputClassName}
                                onChange={(event) =>
                                  onDraftRecordFieldChange(
                                    selectedRecord.samplingId,
                                    'digestionStatus',
                                    event.target.value as typeof selectedRecord.digestionStatus,
                                  )
                                }
                                value={selectedRecord.digestionStatus}
                              >
                                {samplingDigestionStatusOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </FieldBlock>

                            <FieldBlock hint="必须属于当前批次主题键列表。" label="主题键">
                              <select
                                className={inputClassName}
                                onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'themeKey', event.target.value)}
                                value={selectedRecord.themeKey}
                              >
                                {(draft?.batch.themeKeys ?? []).map((themeKey) => (
                                  <option key={themeKey} value={themeKey}>
                                    {themeKey}
                                  </option>
                                ))}
                              </select>
                            </FieldBlock>

                            <FieldBlock hint="写给运营和审核看的中文主题名。" label="主题中文名">
                              <input
                                className={inputClassName}
                                onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'themeLabelZh', event.target.value)}
                                value={selectedRecord.themeLabelZh}
                              />
                            </FieldBlock>

                            <FieldBlock hint="可用商品编号、款号或内部短标识。" label="来源标识">
                              <input
                                className={inputClassName}
                                onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'sourceId', event.target.value)}
                                value={selectedRecord.sourceId}
                              />
                            </FieldBlock>

                            <FieldBlock hint="如果骨架品类不准，再在这里修。" label="品类">
                              <input
                                className={inputClassName}
                                onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'itemCategory', event.target.value)}
                                value={selectedRecord.itemCategory}
                              />
                            </FieldBlock>

                            <FieldBlock hint="例如 spring / autumn / winter / all。" label="季节提示">
                              <input
                                className={inputClassName}
                                onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'seasonHint', event.target.value)}
                                value={selectedRecord.seasonHint ?? ''}
                              />
                            </FieldBlock>
                          </div>

                          <div className="grid gap-4 xl:grid-cols-3">
                            <FieldBlock hint="主色氛围，不必写 hex。" label="主色摘要">
                              <input
                                className={inputClassName}
                                onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'primaryColorSummary', event.target.value)}
                                value={selectedRecord.primaryColorSummary ?? ''}
                              />
                            </FieldBlock>

                            <FieldBlock hint="第二层颜色关系。" label="次色摘要">
                              <input
                                className={inputClassName}
                                onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'secondaryColorSummary', event.target.value)}
                                value={selectedRecord.secondaryColorSummary ?? ''}
                              />
                            </FieldBlock>

                            <FieldBlock hint="只有明显点缀时再写。" label="点缀色摘要">
                              <input
                                className={inputClassName}
                                onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'accentColorSummary', event.target.value)}
                                value={selectedRecord.accentColorSummary ?? ''}
                              />
                            </FieldBlock>
                          </div>

                          <FieldBlock hint="写语义词，不写完整句。" label="风格信号（逗号分隔）">
                            <input
                              className={inputClassName}
                              onChange={(event) =>
                                onDraftRecordArrayFieldChange(selectedRecord.samplingId, 'styleSignals', event.target.value)
                              }
                              value={stringifyCommaSeparatedValues(selectedRecord.styleSignals)}
                            />
                          </FieldBlock>

                          <FieldBlock hint="记录你观察到的市场趋势、品牌倾向或色路判断。" label="市场信号">
                            <textarea
                              className={textareaClassName}
                              onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'marketSignals', event.target.value)}
                              value={selectedRecord.marketSignals ?? ''}
                            />
                          </FieldBlock>

                          <div className="grid gap-4 xl:grid-cols-2">
                            <FieldBlock hint="进入候选短名单后至少填一个。" label="候选色板标识（逗号分隔）">
                              <input
                                className={inputClassName}
                                onChange={(event) =>
                                  onDraftRecordArrayFieldChange(
                                    selectedRecord.samplingId,
                                    'candidatePaletteIds',
                                    event.target.value,
                                  )
                                }
                                value={stringifyCommaSeparatedValues(selectedRecord.candidatePaletteIds)}
                              />
                            </FieldBlock>

                            <FieldBlock hint="进入正式上架后至少填一个。" label="最终色板标识（逗号分隔）">
                              <input
                                className={inputClassName}
                                onChange={(event) =>
                                  onDraftRecordArrayFieldChange(
                                    selectedRecord.samplingId,
                                    'finalPaletteIds',
                                    event.target.value,
                                  )
                                }
                                value={stringifyCommaSeparatedValues(selectedRecord.finalPaletteIds)}
                              />
                            </FieldBlock>
                          </div>

                          <FieldBlock hint="这里写操作提醒、特殊观察或为什么保留这条样本。" label="备注">
                            <textarea
                              className={textareaClassName}
                              onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'notes', event.target.value)}
                              value={selectedRecord.notes}
                            />
                          </FieldBlock>
                        </div>
                      ) : null}
                  </>
                ) : (
                  <div className="rounded-[20px] border border-dashed border-[var(--dp-border-subtle)] bg-white px-5 py-10 text-sm leading-7 text-muted-foreground">
                    当前没有可编辑记录。先在色卡墙里选择一个色盘，再进入抽屉审阅。
                  </div>
                )}
              </div>
            </div>
          </DetailDrawer>
      </div>
      ) : null}
    </div>
  )
}

function CollectProgressPanel({ events, run }: { events: SamplingRunEventDto[]; run: SamplingRunDto | null }): ReactElement {
  if (!run) return <div className="text-sm text-muted-foreground">等待事件...</div>

  const isRunning = run.status === 'running' || run.status === 'queued'

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {isRunning ? '正在生成...' : run.status === 'succeeded' ? '生成完成' : '生成失败'}
          </span>
          <span className="text-muted-foreground">{run.progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--dp-surface-soft)]">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              run.status === 'failed' ? 'bg-red-400' : run.status === 'succeeded' ? 'bg-green-400' : 'bg-[var(--dp-fill-inverse)]',
            )}
            style={{ width: `${run.progressPercent}%` }}
          />
        </div>
      </div>
      <div className="max-h-60 space-y-1 overflow-y-auto rounded-lg bg-[var(--dp-surface-soft)] p-3">
        {events.map((event, index) => {
          const isLast = index === events.length - 1
          const showSpinner = isRunning && isLast && event.level === 'info' && event.type !== 'run-finished'
          return (
            <div key={event.eventId} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5 shrink-0">
                {event.level === 'error' && <X size={12} className="text-red-500" />}
                {event.level === 'warning' && <span className="text-amber-500">!</span>}
                {showSpinner && <RefreshCcw size={12} className="animate-spin text-muted-foreground" />}
                {event.level === 'info' && !showSpinner && <CheckCheck size={12} className="text-green-500" />}
              </span>
              <span className="text-muted-foreground">{event.message}</span>
            </div>
          )
        })}
      </div>
      {run.summary && (
        <div className="rounded-lg bg-[var(--dp-surface-soft)] p-3 text-sm text-muted-foreground">{run.summary}</div>
      )}
    </div>
  )
}