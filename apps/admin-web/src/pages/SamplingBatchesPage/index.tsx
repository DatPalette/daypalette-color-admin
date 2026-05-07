import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import {
  ArrowRight,
  BookOpenText,
  CheckCheck,
  Layers3,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WorkbenchPageHeader } from '@/components/workbench/WorkbenchPageHeader'
import { WorkbenchModal } from '@/components/workbench/WorkbenchModal'
import {
  getSamplingChannelTypeLabel,
  getSamplingDigestionStatusLabel,
  samplingBatchStatusOptions,
  samplingChannelTypeOptions,
  samplingDigestionStatusOptions,
  type SamplingRecordDto,
} from '@/models/sampling-batches'
import { cn } from '@/utils/cn'
import { useSamplingBatchesPageViewModel } from './view-model/useSamplingBatchesPageViewModel'
import {
  isSamplingRecordComplete,
  stringifyCommaSeparatedValues,
} from './view-model/helpers'

const inputClassName =
  'w-full rounded-[14px] border border-[var(--dp-border-subtle)] bg-white/92 px-3.5 py-2.5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] outline-none transition focus:border-[var(--dp-fill-inverse)] focus:bg-white'

const textareaClassName = `${inputClassName} min-h-[112px] resize-y`

const labelClassName = 'label-caps text-muted-foreground'

const fieldShellClassName =
  'space-y-3 rounded-[20px] border border-[var(--dp-border-hairline)] bg-[rgba(247,243,242,0.88)] p-4'

const sourcePriorityItems = [
  {
    value: 'brand-site',
    label: '品牌官网',
    priority: '优先级 1',
    hint: '先找新品专题、lookbook、系列页，最容易看出完整配色关系。',
  },
  {
    value: 'brand-flagship-store',
    label: '官方旗舰店',
    priority: '优先级 2',
    hint: '找官方商品页，适合补平台、品牌和可回溯链接。',
  },
  {
    value: 'multi-brand-platform',
    label: '多品牌平台',
    priority: '优先级 3',
    hint: '当官网样本不够时，再去多品牌平台补不同品牌的同类路线。',
  },
  {
    value: 'marketplace-brand-store',
    label: '平台品牌店',
    priority: '优先级 4',
    hint: '最后兜底，用品牌店公开页补样本，不要先从泛平台截图开始。',
  },
] as const

const helpWorkflowSteps = [
  '先在左侧选一条采样记录，不要一上来就改整批设置。',
  '优先补渠道类型、平台、品牌、来源链接、观察日期、综合色摘要。',
  '填完就先保存；风格信号、市场信号、候选 palette 这些都属于后一步。',
] as const

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
  eyebrow: string
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
            <div className="space-y-2">
              <p className="label-caps text-muted-foreground">{eyebrow}</p>
              <div className="space-y-1">
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

function SamplingHelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): ReactElement {
  return (
    <WorkbenchModal isOpen={isOpen} onClose={onClose} panelClassName="max-w-[720px] rounded-[24px]">
      <ModalHeader
        description="把页面说明收进弹窗里，主界面只保留你进入后马上要做的动作。"
        onClose={onClose}
        title="采样助手怎么用"
      />

      <div className="space-y-6 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-3">
          {helpWorkflowSteps.map((step, index) => (
            <div key={step} className="rounded-[18px] border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] p-4">
              <p className="label-caps text-muted-foreground">步骤 0{index + 1}</p>
              <p className="mt-3 text-sm leading-6 text-foreground">{step}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[18px] border border-[var(--dp-border-subtle)] bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-[var(--dp-fill-inverse)] text-[var(--dp-text-on-inverse)]">
                <BookOpenText className="size-5" />
              </div>
              <div className="space-y-2">
                <p className="label-caps text-muted-foreground">当前不需要</p>
                <p className="text-base font-semibold text-foreground">不需要大模型 API key</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  自动生成候选来源本身不需要模型密钥；只有你希望系统继续做 AI 色路深化时，才需要配置 `DAYPALETTE_LLM_API_KEY` 和 `DAYPALETTE_LLM_MODEL`。
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--dp-border-subtle)] bg-white p-5">
            <p className="label-caps text-muted-foreground">默认先填</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <SamplingBadge tone="soft">渠道类型</SamplingBadge>
              <SamplingBadge tone="soft">平台</SamplingBadge>
              <SamplingBadge tone="soft">品牌</SamplingBadge>
              <SamplingBadge tone="soft">品类</SamplingBadge>
              <SamplingBadge tone="soft">来源链接</SamplingBadge>
              <SamplingBadge tone="soft">观察日期</SamplingBadge>
              <SamplingBadge tone="soft">综合色摘要</SamplingBadge>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              其他字段都已经收进“高级字段”，可以后补，不用第一次就全填。
            </p>
          </div>
        </div>

        <div className="rounded-[18px] border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] p-5">
          <p className="label-caps text-muted-foreground">优先去哪找</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {sourcePriorityItems.map((item) => (
              <div key={item.value} className="rounded-[16px] border border-[var(--dp-border-hairline)] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <SamplingBadge tone="soft">{item.priority}</SamplingBadge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-[var(--dp-border-subtle)] px-6 py-5">
        <Button onClick={onClose} variant="primary">知道了</Button>
      </div>
    </WorkbenchModal>
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

          <FieldBlock hint="例如 workday / holiday / dating。" label="场景 ID">
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

          <FieldBlock hint="记录 themeKey 必须属于这里。" label="子主题 keys">
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

function SamplingBatchCard({
  completedLabel,
  id,
  isSelected,
  occasionLabel,
  onSelect,
  recordCountLabel,
  statusLabel,
  titleZh,
  updatedAtLabel,
}: {
  completedLabel: string
  id: string
  isSelected: boolean
  occasionLabel: string
  onSelect: () => void
  recordCountLabel: string
  statusLabel: string
  titleZh: string
  updatedAtLabel: string
}): ReactElement {
  return (
    <button className="block w-full text-left" onClick={onSelect} type="button">
      <div
        className={cn(
          'rounded-[22px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,243,242,0.92))] p-5 shadow-[0_12px_32px_-24px_rgba(26,26,26,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-28px_rgba(26,26,26,0.3)]',
          isSelected
            ? 'border-[var(--dp-fill-inverse)] bg-white shadow-[0_24px_44px_-28px_rgba(26,26,26,0.36)]'
            : 'border-[var(--dp-border-subtle)]',
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label-caps text-muted-foreground">{id}</p>
            <h3 className="display-font mt-3 text-[1.7rem] leading-none tracking-[-0.04em] text-foreground">
              {titleZh}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{occasionLabel}</p>
          </div>
          <SamplingBadge tone={isSelected ? 'dark' : 'default'}>{statusLabel}</SamplingBadge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <MetricTile label="批次记录" value={recordCountLabel} />
          <MetricTile label="来源完整度" value={completedLabel} />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">最近更新：{updatedAtLabel}</p>
      </div>
    </button>
  )
}

function SamplingRecordNavigatorCard({
  isSelected,
  onSelect,
  record,
}: {
  isSelected: boolean
  onSelect: () => void
  record: SamplingRecordDto
}): ReactElement {
  const isComplete = isSamplingRecordComplete(record)

  return (
    <button className="block w-full text-left" onClick={onSelect} type="button">
      <div
        className={cn(
          'rounded-[20px] border bg-white p-4 shadow-[0_10px_28px_-24px_rgba(26,26,26,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-26px_rgba(26,26,26,0.28)]',
          isSelected ? 'border-[var(--dp-fill-inverse)] shadow-[0_18px_38px_-26px_rgba(26,26,26,0.34)]' : 'border-[var(--dp-border-subtle)]',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{record.samplingId}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {record.themeLabelZh || record.themeKey || '待补主题'} / {record.itemCategory || '待补品类'}
            </p>
          </div>
          <SamplingBadge tone={isComplete ? 'ok' : 'soft'}>{isComplete ? '完整' : '待补'}</SamplingBadge>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <SamplingBadge tone="soft">{getSamplingDigestionStatusLabel(record.digestionStatus)}</SamplingBadge>
          <SamplingBadge tone="soft">{getSamplingChannelTypeLabel(record.channelType)}</SamplingBadge>
        </div>

        <p className="mt-4 text-sm text-foreground">{record.brandName || '待补品牌'}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-2">{record.notes || '还没有补充采样备注。'}</p>
      </div>
    </button>
  )
}

export function SamplingBatchesPage(): ReactElement {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isBatchSettingsOpen, setIsBatchSettingsOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const recordEditorRef = useRef<HTMLDivElement | null>(null)
  const {
    draft,
    errorMessage,
    generationCapabilities,
    isDeleting,
    isGeneratingCandidates,
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
    onGenerateCandidates,
    onRefresh,
    onReviewRecord,
    onSave,
    onSelectBatch,
    onSelectRecord,
    onStartSampling,
    saveMessage,
    selectedBatchId,
    selectedRecord,
    selectedRecordId,
    validationMessages,
  } = useSamplingBatchesPageViewModel()

  useEffect(() => {
    setIsAdvancedOpen(false)
  }, [selectedRecordId])

  const essentialFieldChecklist = selectedRecord
    ? [
        { label: '渠道类型', done: Boolean(selectedRecord.channelType) },
        { label: '平台', done: Boolean(selectedRecord.platform.trim()) },
        { label: '品牌', done: Boolean(selectedRecord.brandName.trim()) },
        { label: '品类', done: Boolean(selectedRecord.itemCategory.trim()) },
        { label: '来源链接', done: Boolean(selectedRecord.sourceUrl.trim()) },
        { label: '观察日期', done: Boolean(selectedRecord.observedAt.trim()) },
        { label: '综合色摘要', done: selectedRecord.colorSummary.length > 0 },
      ]
    : []
  const completedEssentialCount = essentialFieldChecklist.filter((item) => item.done).length
  const nextSamplingRecordId = draft
    ? draft.items.find((item) => item.digestionStatus === 'sampled')?.samplingId ?? draft.items[0]?.samplingId ?? null
    : null
  const startSamplingLabel = selectedRecordId && selectedRecordId === nextSamplingRecordId ? '继续审阅当前候选' : '开始审阅'
  const generationModeLabel = generationCapabilities?.modelEnabled ? 'AI 深化已启用' : '规则生成模式'

  async function handleGenerateCandidates(): Promise<void> {
    await onGenerateCandidates()
    requestAnimationFrame(() => {
      recordEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function handleStartSampling(): void {
    onStartSampling()
    requestAnimationFrame(() => {
      recordEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <div className="space-y-6 pb-10">
      <WorkbenchPageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void onRefresh()} size="sm" variant="ghost">
              <RefreshCcw className="size-4" />
              刷新
            </Button>
            <Button disabled={!draft || isGeneratingCandidates} onClick={() => void handleGenerateCandidates()} size="sm" variant="primary">
              <Sparkles className="size-4" />
              {isGeneratingCandidates ? '生成中' : '自动生成女装候选'}
            </Button>
            <Button disabled={!draft || !nextSamplingRecordId} onClick={handleStartSampling} size="sm" variant="ghost">
              <ArrowRight className="size-4" />
              {startSamplingLabel}
            </Button>
            <Button onClick={() => setIsHelpOpen(true)} size="sm" variant="ghost">
              <BookOpenText className="size-4" />
              使用说明
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
        }
        archivedLabel={model?.archivedLabel ?? '0 个已归档批次'}
        description="主流程只保留三步：生成候选、逐条审阅、必要时少量修正。"
        hideSearch
        onSearchChange={() => {}}
        searchPlaceholder="当前版本暂不支持搜索"
        searchValue=""
        title="候选审阅台"
        totalLabel={model?.totalLabel ?? '读取中'}
        updatedAtLabel={model?.updatedAtLabel ?? '等待返回'}
      />

      <SamplingHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      {draft ? (
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
      ) : null}

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

      <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <SamplingSection
            eyebrow={model ? `${model.cards.length} 个批次` : '批次导航'}
            hint="先选一个候选批次，再进入候选审阅与必要修正。"
            title="候选批次"
            tone="soft"
          >
            <div className="space-y-4">
              {(model?.cards ?? []).map((card) => (
                <SamplingBatchCard
                  key={card.id}
                  completedLabel={card.completedLabel}
                  id={card.id}
                  isSelected={selectedBatchId === card.id}
                  occasionLabel={card.occasionLabel}
                  onSelect={() => onSelectBatch(card.id)}
                  recordCountLabel={card.recordCountLabel}
                  statusLabel={card.statusLabel}
                  titleZh={card.titleZh}
                  updatedAtLabel={card.updatedAtLabel}
                />
              ))}

              {isLoading && !model
                ? Array.from({ length: 2 }).map((_, index) => (
                    <Card key={index} className="min-h-[220px] animate-pulse bg-white/70" />
                  ))
                : null}

              {!isLoading && (model?.cards.length ?? 0) === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[var(--dp-border-subtle)] bg-white/72 px-5 py-8 text-sm leading-7 text-muted-foreground">
                  当前还没有采样批次文件。先生成一个批次，再开始录入来源。
                </div>
              ) : null}
            </div>
          </SamplingSection>
        </aside>

        <div className="space-y-6">
          {draft && model?.detail ? (
            <>
              <SamplingSection
                eyebrow="Review Focus"
                hint="主流程先做通过 / 驳回，说明和策略都收进弹窗，不再占主界面。"
                title={selectedRecord ? '当前审阅上下文' : '先选一条候选记录'}
                tone="soft"
              >
                <div className="space-y-4 rounded-[22px] border border-[var(--dp-border-hairline)] bg-[linear-gradient(180deg,rgba(247,243,242,0.82),rgba(255,255,255,0.96))] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <SamplingBadge tone="dark">当前批次</SamplingBadge>
                    <SamplingBadge tone="soft">{draft.batch.titleZh}</SamplingBadge>
                    <SamplingBadge tone="soft">{draft.batch.status}</SamplingBadge>
                    <SamplingBadge tone={generationCapabilities?.modelEnabled ? 'dark' : 'soft'}>{generationModeLabel}</SamplingBadge>
                    {selectedRecord ? <SamplingBadge tone="soft">{selectedRecord.themeLabelZh || selectedRecord.themeKey || '待补主题'}</SamplingBadge> : null}
                    {selectedRecord?.itemCategory ? <SamplingBadge tone="soft">{selectedRecord.itemCategory}</SamplingBadge> : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <MetricTile label="当前记录" value={selectedRecord?.samplingId ?? '未选择'} />
                    <MetricTile label="必要字段" value={`${completedEssentialCount} / ${essentialFieldChecklist.length || 7}`} />
                    <MetricTile label="批次完整度" value={model.detail.completedLabel} />
                    <MetricTile label="下一条待审" value={nextSamplingRecordId ?? '已到底'} />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button disabled={isGeneratingCandidates || !draft} onClick={() => void handleGenerateCandidates()} variant="primary">
                      <Sparkles className="size-4" />
                      {isGeneratingCandidates ? '生成中' : '刷新当前批次候选'}
                    </Button>
                    <Button disabled={!nextSamplingRecordId} onClick={handleStartSampling} variant="ghost">
                      <ArrowRight className="size-4" />
                      {startSamplingLabel}
                    </Button>
                    <p className="text-sm leading-6 text-muted-foreground">
                      点击“刷新当前批次候选”会重算当前批次的系统候选；说明、来源优先级和策略说明都收在“使用说明”里。
                    </p>
                  </div>
                </div>
              </SamplingSection>

              <div className="grid gap-6 2xl:grid-cols-[300px_minmax(0,1fr)]">
                <SamplingSection
                  actions={
                    <Button onClick={onAddRecord} size="sm" variant="ghost">
                      <Plus className="size-4" />
                      补充候选
                    </Button>
                  }
                  eyebrow={`Record Navigator · ${draft.items.length} 条`}
                  hint="先选一条候选，再决定通过、驳回或进入少量人工修正。"
                  title="逐条审阅"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <SamplingBadge tone="soft">{draft.items.length} 条候选</SamplingBadge>
                      <SamplingBadge tone="soft">{model.detail.completedLabel}</SamplingBadge>
                    </div>

                    <div className="max-h-[920px] space-y-3 overflow-y-auto pr-1">
                      {draft.items.map((record) => (
                        <SamplingRecordNavigatorCard
                          key={record.samplingId}
                          isSelected={selectedRecordId === record.samplingId}
                          onSelect={() => onSelectRecord(record.samplingId)}
                          record={record}
                        />
                      ))}
                    </div>
                  </div>
                </SamplingSection>

                <div ref={recordEditorRef}>
                  <SamplingSection
                  eyebrow="Review Panel"
                  hint="审阅动作优先。只有系统候选缺字段时，再展开下方输入区做人工修正。"
                  title={selectedRecord ? selectedRecord.samplingId : '尚未选择记录'}
                >
                  {selectedRecord ? (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[20px] border border-[var(--dp-border-hairline)] bg-[linear-gradient(180deg,rgba(247,243,242,0.9),rgba(255,255,255,0.92))] p-5">
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

                      <div className="rounded-[20px] border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="space-y-2">
                            <p className={labelClassName}>主动作</p>
                            <p className="text-sm leading-6 text-muted-foreground">
                              先做审阅，不必先把字段填满。通过后系统会自动跳到下一条待审候选。
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

                      <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-4">
                        <div>
                          <p className="label-caps text-muted-foreground">人工修正与补录</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            只有在系统候选缺字段，或你需要补主题、市场信号、候选 palette 等信息时再打开。
                          </p>
                        </div>
                        <Button onClick={() => setIsAdvancedOpen((currentValue) => !currentValue)} size="sm" variant="ghost">
                          {isAdvancedOpen ? '收起高级字段' : '展开高级字段'}
                        </Button>
                      </div>

                      {isAdvancedOpen ? (
                        <div className="space-y-5 rounded-[22px] border border-[var(--dp-border-subtle)] bg-[rgba(247,243,242,0.65)] p-5">
                          <div className="grid gap-4 xl:grid-cols-2">
                            <FieldBlock hint="建议保留稳定规则，不要随意改前缀。" label="samplingId">
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

                            <FieldBlock hint="必须属于当前批次 themeKeys 列表。" label="themeKey">
                              <select
                                className={inputClassName}
                                onChange={(event) => onDraftRecordFieldChange(selectedRecord.samplingId, 'themeKey', event.target.value)}
                                value={selectedRecord.themeKey}
                              >
                                {draft.batch.themeKeys.map((themeKey) => (
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

                            <FieldBlock hint="可用商品编号、款号或内部短标识。" label="来源 ID">
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
                            <FieldBlock hint="进入 shortlisted 后至少填一个。" label="候选 palette IDs（逗号分隔）">
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

                            <FieldBlock hint="进入 published 后至少填一个。" label="最终 palette IDs（逗号分隔）">
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
                    </div>
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-5 py-10 text-sm leading-7 text-muted-foreground">
                      当前没有可编辑记录。先在左侧新增或选择一条采样记录。
                    </div>
                  )}
                  </SamplingSection>
                </div>
              </div>
            </>
          ) : (
            <SamplingSection
              eyebrow="Empty State"
              hint="先准备一个采样批次文件，页面才会出现完整工作台。"
              title="当前没有可展示的采样批次"
            >
              <div className="rounded-[20px] border border-dashed border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-5 py-10 text-sm leading-7 text-muted-foreground">
                当前没有可展示的采样批次。你可以先创建批次文件，再回到这里录入样本。
              </div>
            </SamplingSection>
          )}
        </div>
      </section>
    </div>
  )
}