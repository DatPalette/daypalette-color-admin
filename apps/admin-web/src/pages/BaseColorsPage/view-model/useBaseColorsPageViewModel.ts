import { useEffect, useState } from 'react'

import type {
  BaseColorDeleteCheckDto,
  BaseColorDto,
  BaseColorCollectionDto,
  BaseColorEditorOptions,
  BaseColorsPageModel,
} from '@/models/base-colors'
import {
  createBaseColor,
  deleteBaseColor,
  getBaseColorCollection,
  getBaseColorDeleteCheck,
  getBaseColorEditorDictionaries,
  restoreBaseColor,
  updateBaseColor,
} from '@/services/base-colors/base-colors.service'
import {
  toBaseColorEditorOptions,
  toBaseColorsPageModel,
} from '@/transformers/base-colors/base-colors.transformer'
import {
  buildNewBaseColorDraft,
  cloneBaseColor,
  findSelectedBaseColor,
  getArchivedBaseColors,
  toCreatePayload,
  toUpdatePayload,
  type EditableScalarField,
  type EditableTagField,
} from './helpers'

interface BaseColorsPageViewModel {
  archivedBaseColors: BaseColorDto[]
  deleteCheck: BaseColorDeleteCheckDto | null
  deleteReason: string
  draft: BaseColorDto | null
  editorOptions: BaseColorEditorOptions | null
  errorMessage: string | null
  isCreating: boolean
  isDeleteChecking: boolean
  isDeleting: boolean
  isLoading: boolean
  isRestoringId: string | null
  isSaving: boolean
  model: BaseColorsPageModel | null
  onCreateDraft: () => void
  onCheckDeleteRisk: () => Promise<void>
  onDelete: () => Promise<void>
  onDeleteReasonChange: (value: string) => void
  onDraftFieldChange: <TField extends EditableScalarField>(
    field: TField,
    value: BaseColorDto[TField],
  ) => void
  onDraftTagToggle: (field: EditableTagField, value: string) => void
  onRefresh: () => Promise<void>
  onRestore: (id: string) => Promise<void>
  onSave: () => Promise<void>
  onSelectBaseColor: (id: string) => void
  saveMessage: string | null
}

// 基础色页面状态编排层，负责串联列表读取、草稿编辑、删除检查和恢复流程。
export function useBaseColorsPageViewModel(): BaseColorsPageViewModel {
  const [collection, setCollection] = useState<BaseColorCollectionDto | null>(null)
  const [allCollection, setAllCollection] = useState<BaseColorCollectionDto | null>(null)
  const [selectedBaseColorId, setSelectedBaseColorId] = useState<string | null>(null)
  const [deleteCheck, setDeleteCheck] = useState<BaseColorDeleteCheckDto | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [draft, setDraft] = useState<BaseColorDto | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editorOptions, setEditorOptions] = useState<BaseColorEditorOptions | null>(null)
  const [model, setModel] = useState<BaseColorsPageModel | null>(null)
  const [isDeleteChecking, setIsDeleteChecking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRestoringId, setIsRestoringId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    void onRefresh()
  }, [])

  async function onRefresh(): Promise<void> {
    setIsLoading(true)
    setDeleteCheck(null)
    setDeleteReason('')
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const [nextCollection, nextAllCollection, nextDictionaries] = await Promise.all([
        getBaseColorCollection(),
        getBaseColorCollection({ includeDeleted: true }),
        getBaseColorEditorDictionaries(),
      ])
      const nextEditorOptions = toBaseColorEditorOptions(nextDictionaries)
      const nextSelectedBaseColorId = selectedBaseColorId ?? nextCollection.items[0]?.id ?? null
      const nextSelectedBaseColor =
        nextCollection.items.find((item) => item.id === nextSelectedBaseColorId) ??
        nextCollection.items[0] ??
        null

      setCollection(nextCollection)
      setAllCollection(nextAllCollection)
      setEditorOptions(nextEditorOptions)
      setSelectedBaseColorId(nextSelectedBaseColorId)
      setIsCreating(false)
      setModel(toBaseColorsPageModel(nextCollection, nextSelectedBaseColorId, nextEditorOptions))
      setDraft(cloneBaseColor(nextSelectedBaseColor))
    } catch {
      setErrorMessage('基础色列表加载失败。请先启动 admin-api，再刷新页面。')
    } finally {
      setIsLoading(false)
    }
  }

  function onSelectBaseColor(id: string): void {
    setSelectedBaseColorId(id)
    setDeleteCheck(null)
    setDeleteReason('')
    setIsCreating(false)
    setSaveMessage(null)

    if (!collection) {
      return
    }

    setModel(toBaseColorsPageModel(collection, id, editorOptions))
    setDraft(cloneBaseColor(findSelectedBaseColor(collection, id)))
  }

  function onCreateDraft(): void {
    if (!editorOptions) {
      return
    }

    setSelectedBaseColorId(null)
    setDeleteCheck(null)
    setDeleteReason('')
    setIsCreating(true)
    setSaveMessage(null)
    setDraft(buildNewBaseColorDraft(editorOptions))
  }

  function onDeleteReasonChange(value: string): void {
    setDeleteReason(value)
  }

  function onDraftFieldChange<TField extends EditableScalarField>(
    field: TField,
    value: BaseColorDto[TField],
  ): void {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      return {
        ...currentDraft,
        [field]: value,
      }
    })
    setSaveMessage(null)
  }

  function onDraftTagToggle(field: EditableTagField, value: string): void {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      const hasValue = currentDraft[field].includes(value)

      return {
        ...currentDraft,
        [field]: hasValue
          ? currentDraft[field].filter((currentValue) => currentValue !== value)
          : [...currentDraft[field], value],
      }
    })
    setSaveMessage(null)
  }

  async function onSave(): Promise<void> {
    if (!draft) {
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const nextCollection = isCreating
        ? await createBaseColor(toCreatePayload(draft))
        : await updateBaseColor(draft.id, toUpdatePayload(draft))
      const nextAllCollection = await getBaseColorCollection({ includeDeleted: true })
      const nextSelectedBaseColorId =
        nextCollection.items.find((item) => item.id === draft.id)?.id ?? nextCollection.items[0]?.id ?? null
      const nextSelectedBaseColor = findSelectedBaseColor(nextCollection, nextSelectedBaseColorId)

      setCollection(nextCollection)
      setAllCollection(nextAllCollection)
      setSelectedBaseColorId(nextSelectedBaseColorId)
      setIsCreating(false)
      setModel(toBaseColorsPageModel(nextCollection, nextSelectedBaseColorId, editorOptions))
      setDraft(cloneBaseColor(nextSelectedBaseColor))
      setSaveMessage(isCreating ? '已新增基础色，并写回 base-colors.v1.json。' : '已写回 base-colors.v1.json。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : isCreating ? '基础色新增失败。' : '基础色保存失败。')
    } finally {
      setIsSaving(false)
    }
  }

  async function onCheckDeleteRisk(): Promise<void> {
    if (!draft) {
      return
    }

    setIsDeleteChecking(true)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const nextDeleteCheck = await getBaseColorDeleteCheck(draft.id)

      setDeleteCheck(nextDeleteCheck)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '基础色删除检查失败。')
    } finally {
      setIsDeleteChecking(false)
    }
  }

  async function onDelete(): Promise<void> {
    if (!draft || isCreating) {
      return
    }

    setIsDeleting(true)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const latestDeleteCheck = deleteCheck ?? (await getBaseColorDeleteCheck(draft.id))

      setDeleteCheck(latestDeleteCheck)

      if (!latestDeleteCheck.canDelete) {
        setErrorMessage('当前基础色仍被配色盘引用，不能执行软删除。')
        return
      }

      const nextCollection = await deleteBaseColor(draft.id, {
        deleteReason,
      })
      const nextAllCollection = await getBaseColorCollection({ includeDeleted: true })
      const nextSelectedBaseColorId = nextCollection.items[0]?.id ?? null
      const nextSelectedBaseColor = findSelectedBaseColor(nextCollection, nextSelectedBaseColorId)

      setCollection(nextCollection)
      setAllCollection(nextAllCollection)
      setSelectedBaseColorId(nextSelectedBaseColorId)
      setDeleteCheck(null)
      setDeleteReason('')
      setModel(toBaseColorsPageModel(nextCollection, nextSelectedBaseColorId, editorOptions))
      setDraft(cloneBaseColor(nextSelectedBaseColor))
      setSaveMessage('已执行基础色软删除，并写回 base-colors.v1.json。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '基础色软删除失败。')
    } finally {
      setIsDeleting(false)
    }
  }

  async function onRestore(id: string): Promise<void> {
    setIsRestoringId(id)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const nextCollection = await restoreBaseColor(id)
      const nextAllCollection = await getBaseColorCollection({ includeDeleted: true })
      const nextSelectedBaseColor = findSelectedBaseColor(nextCollection, id)

      setCollection(nextCollection)
      setAllCollection(nextAllCollection)
      setSelectedBaseColorId(nextSelectedBaseColor?.id ?? nextCollection.items[0]?.id ?? null)
      setIsCreating(false)
      setModel(toBaseColorsPageModel(nextCollection, id, editorOptions))
      setDraft(cloneBaseColor(nextSelectedBaseColor))
      setSaveMessage('已恢复基础色，并重新回到可编辑列表。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '基础色恢复失败。')
    } finally {
      setIsRestoringId(null)
    }
  }

  return {
    archivedBaseColors: getArchivedBaseColors(allCollection),
    deleteCheck,
    deleteReason,
    draft,
    editorOptions,
    errorMessage,
    isCreating,
    isDeleteChecking,
    isDeleting,
    isLoading,
    isRestoringId,
    isSaving,
    model,
    onCreateDraft,
    onCheckDeleteRisk,
    onDelete,
    onDeleteReasonChange,
    onDraftFieldChange,
    onDraftTagToggle,
    onRefresh,
    onRestore,
    onSave,
    onSelectBaseColor,
    saveMessage,
  }
}