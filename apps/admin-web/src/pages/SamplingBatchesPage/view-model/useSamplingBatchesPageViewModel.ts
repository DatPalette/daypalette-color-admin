import { useEffect, useState } from 'react'

import type {
  SamplingBatchCollectionDto,
  SamplingBatchDto,
  SamplingBatchesPageModel,
  SamplingCandidateGenerationCapabilitiesDto,
  SamplingRecordDto,
} from '@/models/sampling-batches'
import type { SamplingBatchStatus } from '@daypalette-color-admin/contracts'

import {
  deleteSamplingBatch,
  generateSamplingBatchCandidates,
  getSamplingBatchCapabilities,
  getSamplingBatchCollection,
  updateSamplingBatch,
  updateSamplingBatchStatus,
} from '@/services/sampling-batches/sampling-batches.service'
import { toSamplingBatchesPageModel } from '@/transformers/sampling-batches/sampling-batches.transformer'
import {
  buildCollectionWithDraft,
  buildNewSamplingRecord,
  cloneSamplingBatch,
  findFirstIncompleteRecordId,
  findFirstPendingReviewRecordId,
  findSelectedBatch,
  findSelectedBatchId,
  findSelectedRecord,
  findSelectedRecordId,
  getSamplingBatchValidationMessages,
  type EditableSamplingBatchField,
  type EditableSamplingRecordArrayField,
  type EditableSamplingRecordField,
  parseCommaSeparatedValues,
  upsertSamplingBatchInCollection,
} from './helpers'

interface SamplingBatchesPageViewModel {
  draft: SamplingBatchDto | null
  errorMessage: string | null
  generationCapabilities: SamplingCandidateGenerationCapabilitiesDto | null
  isDeleting: boolean
  isGeneratingCandidates: boolean
  isLoading: boolean
  isSaving: boolean
  isUpdatingStatus: boolean
  model: SamplingBatchesPageModel | null
  onAddRecord: () => void
  onDeleteBatch: () => Promise<void>
  onDeleteRecord: (samplingId: string) => void
  onDraftBatchFieldChange: <TField extends EditableSamplingBatchField>(
    field: TField,
    value: SamplingBatchDto['batch'][TField],
  ) => void
  onDraftBatchStatusChange: (status: SamplingBatchStatus) => void
  onDraftRecordArrayFieldChange: (
    samplingId: string,
    field: EditableSamplingRecordArrayField,
    value: string,
  ) => void
  onDraftRecordFieldsPatch: (samplingId: string, fields: Partial<SamplingRecordDto>) => void
  onDraftRecordFieldChange: (
    samplingId: string,
    field: EditableSamplingRecordField,
    value: SamplingRecordDto[EditableSamplingRecordField],
  ) => void
  onDraftSourceWhitelistToggle: (channelType: string) => void
  onDraftThemeKeysChange: (value: string) => void
  onGenerateCandidates: () => Promise<void>
  onRefresh: () => Promise<void>
  onReviewRecord: (samplingId: string, status: SamplingRecordDto['digestionStatus']) => Promise<void>
  onSave: () => Promise<void>
  onSelectBatch: (id: string) => void
  onSelectRecord: (samplingId: string) => void
  onStartSampling: () => void
  onUpdateStatus: () => Promise<void>
  saveMessage: string | null
  selectedRecord: SamplingRecordDto | null
  selectedBatchId: string | null
  selectedRecordId: string | null
  validationMessages: string[]
}

export function useSamplingBatchesPageViewModel(): SamplingBatchesPageViewModel {
  const [generationCapabilities, setGenerationCapabilities] = useState<SamplingCandidateGenerationCapabilitiesDto | null>(null)
  const [collection, setCollection] = useState<SamplingBatchCollectionDto | null>(null)
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [draft, setDraft] = useState<SamplingBatchDto | null>(null)
  const [model, setModel] = useState<SamplingBatchesPageModel | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGeneratingCandidates, setIsGeneratingCandidates] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    void onRefresh()
  }, [])

  function syncPageState(
    nextCollection: SamplingBatchCollectionDto,
    nextSelectedBatchId: string | null,
    nextDraft: SamplingBatchDto | null,
    nextSelectedRecordId: string | null,
  ): void {
    setCollection(nextCollection)
    setSelectedBatchId(nextSelectedBatchId)
    setSelectedRecordId(nextSelectedRecordId)
    setDraft(nextDraft)
    setModel(
      toSamplingBatchesPageModel(
        buildCollectionWithDraft(nextCollection, nextDraft),
        nextDraft?.batch.id ?? nextSelectedBatchId,
      ),
    )
  }

  function applyDraft(
    nextDraft: SamplingBatchDto | null,
    nextSelectedRecordIdOverride?: string | null,
  ): void {
    if (!collection) {
      setDraft(nextDraft)
      return
    }

    const nextSelectedRecordId = findSelectedRecordId(
      nextDraft,
      nextSelectedRecordIdOverride ?? selectedRecordId,
    )

    syncPageState(collection, nextDraft?.batch.id ?? selectedBatchId, nextDraft, nextSelectedRecordId)
  }

  async function onRefresh(): Promise<void> {
    setIsLoading(true)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const [nextCollection, nextCapabilities] = await Promise.all([
        getSamplingBatchCollection(),
        getSamplingBatchCapabilities(),
      ])
      const nextSelectedBatchId = findSelectedBatchId(nextCollection, selectedBatchId)
      const nextDraft = cloneSamplingBatch(findSelectedBatch(nextCollection, nextSelectedBatchId))
      const nextSelectedRecordId = findSelectedRecordId(nextDraft, selectedRecordId)

      setGenerationCapabilities(nextCapabilities)
      syncPageState(nextCollection, nextSelectedBatchId, nextDraft, nextSelectedRecordId)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '采样批次列表加载失败。请先启动 admin-api，再刷新页面。',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function onGenerateCandidates(): Promise<void> {
    if (!draft || !collection) {
      return
    }

    setIsGeneratingCandidates(true)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const nextBatch = await generateSamplingBatchCandidates(draft.batch.id, {
        audience: 'womenswear',
        mode: generationCapabilities?.defaultMode ?? 'rules-only',
        overwriteExisting: false,
      })
      const nextCollection = upsertSamplingBatchInCollection(collection, nextBatch)
      const nextDraft = cloneSamplingBatch(nextBatch)
      const nextSelectedRecordId = findFirstPendingReviewRecordId(nextDraft) ?? findSelectedRecordId(nextDraft, null)

      syncPageState(nextCollection, nextBatch.batch.id, nextDraft, nextSelectedRecordId)
      setSaveMessage('已为当前批次自动生成女装候选；若后端配置模型环境变量，颜色摘要也会一并深化。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '自动生成候选失败。')
    } finally {
      setIsGeneratingCandidates(false)
    }
  }

  function onSelectBatch(id: string): void {
    if (!collection) {
      return
    }

    const nextDraft = cloneSamplingBatch(findSelectedBatch(collection, id))
    const nextSelectedRecordId = findSelectedRecordId(nextDraft, null)

    setErrorMessage(null)
    setSaveMessage(null)
    syncPageState(collection, id, nextDraft, nextSelectedRecordId)
  }

  function onSelectRecord(samplingId: string): void {
    setSelectedRecordId(samplingId)
  }

  function onStartSampling(): void {
    if (!draft) {
      return
    }

    setErrorMessage(null)
    setSaveMessage(null)
    setSelectedRecordId(findFirstPendingReviewRecordId(draft) ?? findFirstIncompleteRecordId(draft))
  }

  function onDraftBatchFieldChange<TField extends EditableSamplingBatchField>(
    field: TField,
    value: SamplingBatchDto['batch'][TField],
  ): void {
    if (!draft) {
      return
    }

    setErrorMessage(null)
    setSaveMessage(null)
    applyDraft({
      ...draft,
      batch: {
        ...draft.batch,
        [field]: value,
      },
    })
  }

  function onDraftBatchStatusChange(status: SamplingBatchStatus): void {
    if (!draft) {
      return
    }

    setErrorMessage(null)
    setSaveMessage(null)
    applyDraft({
      ...draft,
      batch: {
        ...draft.batch,
        status,
      },
    })
  }

  function onDraftThemeKeysChange(value: string): void {
    if (!draft) {
      return
    }

    setErrorMessage(null)
    setSaveMessage(null)
    applyDraft({
      ...draft,
      batch: {
        ...draft.batch,
        themeKeys: parseCommaSeparatedValues(value),
      },
    })
  }

  function onDraftSourceWhitelistToggle(channelType: string): void {
    if (!draft) {
      return
    }

    const hasChannel = draft.batch.sourceWhitelistIds.includes(channelType)

    setErrorMessage(null)
    setSaveMessage(null)
    applyDraft({
      ...draft,
      batch: {
        ...draft.batch,
        sourceWhitelistIds: hasChannel
          ? draft.batch.sourceWhitelistIds.filter((item) => item !== channelType)
          : [...draft.batch.sourceWhitelistIds, channelType],
      },
    })
  }

  function onDraftRecordFieldChange(
    samplingId: string,
    field: EditableSamplingRecordField,
    value: SamplingRecordDto[EditableSamplingRecordField],
  ): void {
    if (!draft) {
      return
    }

    setErrorMessage(null)
    setSaveMessage(null)
    const nextDraft = {
      ...draft,
      items: draft.items.map((item) =>
        item.samplingId === samplingId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }

    applyDraft(nextDraft, field === 'samplingId' ? String(value) : undefined)
  }

  function onDraftRecordFieldsPatch(samplingId: string, fields: Partial<SamplingRecordDto>): void {
    if (!draft) {
      return
    }

    setErrorMessage(null)
    setSaveMessage(null)
    applyDraft({
      ...draft,
      items: draft.items.map((item) =>
        item.samplingId === samplingId
          ? {
              ...item,
              ...fields,
            }
          : item,
      ),
    })
  }

  function onDraftRecordArrayFieldChange(
    samplingId: string,
    field: EditableSamplingRecordArrayField,
    value: string,
  ): void {
    if (!draft) {
      return
    }

    setErrorMessage(null)
    setSaveMessage(null)
    applyDraft({
      ...draft,
      items: draft.items.map((item) =>
        item.samplingId === samplingId
          ? {
              ...item,
              [field]: parseCommaSeparatedValues(value),
            }
          : item,
      ),
    })
  }

  function onAddRecord(): void {
    if (!draft) {
      return
    }

    const nextRecord = buildNewSamplingRecord(draft)
    const nextDraft = {
      ...draft,
      items: [...draft.items, nextRecord],
    }

    setErrorMessage(null)
    setSaveMessage(null)
    setSelectedRecordId(nextRecord.samplingId)
    applyDraft(nextDraft)
  }

  function onDeleteRecord(samplingId: string): void {
    if (!draft) {
      return
    }

    const nextDraft = {
      ...draft,
      items: draft.items.filter((item) => item.samplingId !== samplingId),
    }

    setErrorMessage(null)
    setSaveMessage(null)
    syncPageState(
      collection ?? { items: [], updatedAt: '', version: 0 },
      nextDraft.batch.id,
      nextDraft,
      findSelectedRecordId(nextDraft, selectedRecordId === samplingId ? null : selectedRecordId),
    )
  }

  async function onSave(): Promise<void> {
    if (!draft || !collection) {
      return
    }

    const validationMessages = getSamplingBatchValidationMessages(draft)

    if (validationMessages.length > 0) {
      setErrorMessage(validationMessages.join(' '))
      setSaveMessage(null)
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const nextBatch = await updateSamplingBatch(draft.batch.id, draft)
      const nextCollection = upsertSamplingBatchInCollection(collection, nextBatch)
      const nextDraft = cloneSamplingBatch(nextBatch)
      const nextSelectedRecordId = findSelectedRecordId(nextDraft, selectedRecordId)

      syncPageState(nextCollection, nextBatch.batch.id, nextDraft, nextSelectedRecordId)
      setSaveMessage('已写回采样批次文件。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '采样批次保存失败。')
    } finally {
      setIsSaving(false)
    }
  }

  async function onReviewRecord(
    samplingId: string,
    status: SamplingRecordDto['digestionStatus'],
  ): Promise<void> {
    if (!draft || !collection) {
      return
    }

    const nextDraft = {
      ...draft,
      items: draft.items.map((item) =>
        item.samplingId === samplingId
          ? {
              ...item,
              digestionStatus: status,
            }
          : item,
      ),
    }

    const validationMessages = getSamplingBatchValidationMessages(nextDraft)

    if (validationMessages.length > 0) {
      setErrorMessage(validationMessages.join(' '))
      setSaveMessage(null)
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const savedBatch = await updateSamplingBatch(nextDraft.batch.id, nextDraft)
      const nextCollection = upsertSamplingBatchInCollection(collection, savedBatch)
      const savedDraft = cloneSamplingBatch(savedBatch)
      const nextSelectedRecordId = findFirstPendingReviewRecordId(savedDraft) ?? findSelectedRecordId(savedDraft, samplingId)

      syncPageState(nextCollection, savedBatch.batch.id, savedDraft, nextSelectedRecordId)
      setSaveMessage(`已更新 ${samplingId} 的审阅状态。`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '候选审阅状态更新失败。')
    } finally {
      setIsSaving(false)
    }
  }

  async function onUpdateStatus(): Promise<void> {
    if (!draft || !collection) {
      return
    }

    setIsUpdatingStatus(true)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const nextBatch = await updateSamplingBatchStatus(draft.batch.id, draft.batch.status)
      const nextCollection = upsertSamplingBatchInCollection(collection, nextBatch)
      const nextDraft = cloneSamplingBatch(nextBatch)
      const nextSelectedRecordId = findSelectedRecordId(nextDraft, selectedRecordId)

      syncPageState(nextCollection, nextBatch.batch.id, nextDraft, nextSelectedRecordId)
      setSaveMessage(`已将批次状态更新为 ${nextBatch.batch.status}。`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '批次状态更新失败。')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  async function onDeleteBatch(): Promise<void> {
    if (!draft) {
      return
    }

    if (!window.confirm(`确定删除采样批次 ${draft.batch.titleZh} 吗？此操作会移除对应 JSON 文件。`)) {
      return
    }

    setIsDeleting(true)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const nextCollection = await deleteSamplingBatch(draft.batch.id)
      const nextSelectedBatchId = findSelectedBatchId(nextCollection, null)
      const nextDraft = cloneSamplingBatch(findSelectedBatch(nextCollection, nextSelectedBatchId))
      const nextSelectedRecordId = findSelectedRecordId(nextDraft, null)

      syncPageState(nextCollection, nextSelectedBatchId, nextDraft, nextSelectedRecordId)
      setSaveMessage(`已删除批次 ${draft.batch.id}。`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '批次删除失败。')
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    draft,
    errorMessage,
    generationCapabilities,
    isDeleting,
    isGeneratingCandidates,
    isLoading,
    isSaving,
    isUpdatingStatus,
    model,
    onAddRecord,
    onDeleteBatch,
    onDeleteRecord,
    onDraftBatchFieldChange,
    onDraftBatchStatusChange,
    onDraftRecordArrayFieldChange,
    onDraftRecordFieldsPatch,
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
    onUpdateStatus,
    saveMessage,
    selectedRecord: findSelectedRecord(draft, selectedRecordId),
    selectedBatchId,
    selectedRecordId,
    validationMessages: draft ? getSamplingBatchValidationMessages(draft) : [],
  }
}