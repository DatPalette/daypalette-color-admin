import { useEffect, useState } from 'react'

import { getBaseColorCollection } from '@/services/base-colors/base-colors.service'
import type { BaseColorCollectionDto } from '@/models/base-colors'
import { getCollectionsCollection } from '@/services/collections/collections.service'
import { getDictionariesCollection } from '@/services/dictionaries/dictionaries.service'
import type {
  PaletteCollectionDto,
  PaletteDeleteCheckDto,
  PaletteDto,
  PaletteEditorOptions,
  PalettesPageModel,
} from '@/models/palettes'
import {
  createPalette,
  deletePalette,
  getPaletteDeleteCheck,
  getPalettesCollection,
  restorePalette,
  updatePalette,
} from '@/services/palettes/palettes.service'
import {
  toPaletteEditorOptions,
  toPalettesPageModel,
} from '@/transformers/palettes/palettes.transformer'
import {
  buildNewPaletteDraft,
  clonePalette,
  findSelectedPalette,
  findSelectedPaletteId,
  getArchivedPalettes,
  type EditableScalarField,
  type EditableTagField,
  toCreatePayload,
  toUpdatePayload,
} from './helpers'

interface PalettesPageViewModel {
  archivedPalettes: PaletteDto[]
  deleteCheck: PaletteDeleteCheckDto | null
  deleteReason: string
  draft: PaletteDto | null
  editorOptions: PaletteEditorOptions | null
  errorMessage: string | null
  isCreating: boolean
  isDeleteChecking: boolean
  isDeleting: boolean
  isLoading: boolean
  isRestoringId: string | null
  isSaving: boolean
  model: PalettesPageModel | null
  onCreateDraft: () => void
  onCheckDeleteRisk: () => Promise<void>
  onDelete: () => Promise<void>
  onDeleteReasonChange: (value: string) => void
  onDraftFieldChange: <TField extends EditableScalarField>(field: TField, value: PaletteDto[TField]) => void
  onDraftTagToggle: (field: EditableTagField, value: string) => void
  onRefresh: () => Promise<void>
  onRestore: (id: string) => Promise<void>
  onSave: () => Promise<void>
  onSelectPalette: (id: string) => void
  saveMessage: string | null
}

// 配色盘页面状态编排层，负责串联列表读取、新增草稿、删除检查和恢复流程。
export function usePalettesPageViewModel(): PalettesPageViewModel {
  const [collection, setCollection] = useState<PaletteCollectionDto | null>(null)
  const [allCollection, setAllCollection] = useState<PaletteCollectionDto | null>(null)
  const [baseColorCollection, setBaseColorCollection] = useState<BaseColorCollectionDto | null>(null)
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(null)
  const [deleteCheck, setDeleteCheck] = useState<PaletteDeleteCheckDto | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [draft, setDraft] = useState<PaletteDto | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editorOptions, setEditorOptions] = useState<PaletteEditorOptions | null>(null)
  const [model, setModel] = useState<PalettesPageModel | null>(null)
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
      const [nextCollection, nextAllCollection, baseColors, collections, dictionaries] = await Promise.all([
        getPalettesCollection(),
        getPalettesCollection({ includeDeleted: true }),
        getBaseColorCollection(),
        getCollectionsCollection(),
        getDictionariesCollection(),
      ])
      const nextEditorOptions = toPaletteEditorOptions(baseColors, collections, dictionaries)
      const nextSelectedPaletteId = findSelectedPaletteId(nextCollection, selectedPaletteId)
      const nextSelectedPalette = findSelectedPalette(nextCollection, nextSelectedPaletteId)

      setCollection(nextCollection)
      setAllCollection(nextAllCollection)
      setBaseColorCollection(baseColors)
      setEditorOptions(nextEditorOptions)
      setSelectedPaletteId(nextSelectedPaletteId)
      setIsCreating(false)
      setModel(toPalettesPageModel(nextCollection, nextSelectedPaletteId, baseColors, nextEditorOptions))
      setDraft(clonePalette(nextSelectedPalette))
    } catch {
      setErrorMessage('配色盘列表加载失败。请先启动 admin-api，再刷新页面。')
    } finally {
      setIsLoading(false)
    }
  }

  function onSelectPalette(id: string): void {
    if (!collection) {
      return
    }

    setSelectedPaletteId(id)
    setDeleteCheck(null)
    setDeleteReason('')
    setIsCreating(false)
    setSaveMessage(null)
    setModel(toPalettesPageModel(collection, id, baseColorCollection, editorOptions))
    setDraft(clonePalette(findSelectedPalette(collection, id)))
  }

  function onCreateDraft(): void {
    if (!editorOptions) {
      return
    }

    setSelectedPaletteId(null)
    setDeleteCheck(null)
    setDeleteReason('')
    setIsCreating(true)
    setSaveMessage(null)
    setDraft(buildNewPaletteDraft(editorOptions))
  }

  function onDeleteReasonChange(value: string): void {
    setDeleteReason(value)
  }

  function onDraftFieldChange<TField extends EditableScalarField>(
    field: TField,
    value: PaletteDto[TField],
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
        ? await createPalette(toCreatePayload(draft))
        : await updatePalette(draft.id, toUpdatePayload(draft))
      const nextAllCollection = await getPalettesCollection({ includeDeleted: true })
      const nextSelectedPalette = findSelectedPalette(nextCollection, draft.id)

      setCollection(nextCollection)
      setAllCollection(nextAllCollection)
      setSelectedPaletteId(nextSelectedPalette?.id ?? nextCollection.items[0]?.id ?? null)
      setIsCreating(false)
      setModel(toPalettesPageModel(nextCollection, draft.id, baseColorCollection, editorOptions))
      setDraft(clonePalette(nextSelectedPalette))
      setSaveMessage(isCreating ? '已新增配色盘，并写回 palettes.v1.json。' : '已写回 palettes.v1.json。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : isCreating ? '配色盘新增失败。' : '配色盘保存失败。')
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
      const nextDeleteCheck = await getPaletteDeleteCheck(draft.id)

      setDeleteCheck(nextDeleteCheck)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '配色盘删除检查失败。')
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
      const latestDeleteCheck = deleteCheck ?? (await getPaletteDeleteCheck(draft.id))

      setDeleteCheck(latestDeleteCheck)

      if (!latestDeleteCheck.canDelete) {
        setErrorMessage('当前配色盘仍被合集引用，不能执行软删除。')
        return
      }

      const nextCollection = await deletePalette(draft.id, { deleteReason })
      const nextAllCollection = await getPalettesCollection({ includeDeleted: true })
      const nextSelectedPaletteId = nextCollection.items[0]?.id ?? null
      const nextSelectedPalette = findSelectedPalette(nextCollection, nextSelectedPaletteId)

      setCollection(nextCollection)
      setAllCollection(nextAllCollection)
      setSelectedPaletteId(nextSelectedPaletteId)
      setIsCreating(false)
      setDeleteCheck(null)
      setDeleteReason('')
      setModel(toPalettesPageModel(nextCollection, nextSelectedPaletteId, baseColorCollection, editorOptions))
      setDraft(clonePalette(nextSelectedPalette))
      setSaveMessage('已执行配色盘软删除，并写回 palettes.v1.json。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '配色盘软删除失败。')
    } finally {
      setIsDeleting(false)
    }
  }

  async function onRestore(id: string): Promise<void> {
    setIsRestoringId(id)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const nextCollection = await restorePalette(id)
      const nextAllCollection = await getPalettesCollection({ includeDeleted: true })
      const nextSelectedPalette = findSelectedPalette(nextCollection, id)

      setCollection(nextCollection)
      setAllCollection(nextAllCollection)
      setSelectedPaletteId(nextSelectedPalette?.id ?? nextCollection.items[0]?.id ?? null)
      setIsCreating(false)
      setModel(toPalettesPageModel(nextCollection, id, baseColorCollection, editorOptions))
      setDraft(clonePalette(nextSelectedPalette))
      setSaveMessage('已恢复配色盘，并重新回到可编辑列表。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '配色盘恢复失败。')
    } finally {
      setIsRestoringId(null)
    }
  }

  return {
    archivedPalettes: getArchivedPalettes(allCollection),
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
    onSelectPalette,
    saveMessage,
  }
}