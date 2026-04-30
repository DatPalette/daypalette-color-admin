import { useEffect, useState } from 'react'

import { getDictionariesCollection } from '@/services/dictionaries/dictionaries.service'
import type {
  CollectionDeleteCheckDto,
  CollectionDto,
  CollectionEditorOptions,
  CollectionsDocumentDto,
  CollectionsPageModel,
} from '@/models/collections'
import {
  deleteCollection,
  getCollectionDeleteCheck,
  getCollectionsCollection,
  restoreCollection,
  updateCollection,
} from '@/services/collections/collections.service'
import {
  toCollectionEditorOptions,
  toCollectionsPageModel,
} from '@/transformers/collections/collections.transformer'
import type { PaletteCollectionDto } from '@/models/palettes'
import { getPalettesCollection } from '@/services/palettes/palettes.service'
import {
  buildDraftWithPaletteIds,
  cloneCollection,
  findSelectedCollection,
  findSelectedCollectionId,
  getArchivedCollections,
  movePaletteId,
  type EditableScalarField,
  type EditableTagField,
  toUpdatePayload,
} from './helpers'

interface CollectionsPageViewModel {
  archivedCollections: CollectionDto[]
  deleteCheck: CollectionDeleteCheckDto | null
  deleteReason: string
  draft: CollectionDto | null
  editorOptions: CollectionEditorOptions | null
  errorMessage: string | null
  isDeleteChecking: boolean
  isDeleting: boolean
  isLoading: boolean
  isRestoringId: string | null
  isSaving: boolean
  model: CollectionsPageModel | null
  onAddPaletteMember: (paletteId: string) => void
  onCheckDeleteRisk: () => Promise<void>
  onDelete: () => Promise<void>
  onDeleteReasonChange: (value: string) => void
  onDraftFieldChange: <TField extends EditableScalarField>(field: TField, value: CollectionDto[TField]) => void
  onMovePaletteMember: (paletteId: string, direction: 'up' | 'down') => void
  onRemovePaletteMember: (paletteId: string) => void
  onDraftTagToggle: (field: EditableTagField, value: string) => void
  onRefresh: () => Promise<void>
  onRestore: (id: string) => Promise<void>
  onSave: () => Promise<void>
  onSelectCollection: (id: string) => void
  onSetCoverPalette: (paletteId: string) => void
  saveMessage: string | null
}

// 合集页面状态编排层，负责成员排序、封面维护、删除保护和恢复流程的状态收敛。
export function useCollectionsPageViewModel(): CollectionsPageViewModel {
  const [collectionDocument, setCollectionDocument] = useState<CollectionsDocumentDto | null>(null)
  const [allCollectionDocument, setAllCollectionDocument] = useState<CollectionsDocumentDto | null>(null)
  const [paletteCollection, setPaletteCollection] = useState<PaletteCollectionDto | null>(null)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [deleteCheck, setDeleteCheck] = useState<CollectionDeleteCheckDto | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [draft, setDraft] = useState<CollectionDto | null>(null)
  const [editorOptions, setEditorOptions] = useState<CollectionEditorOptions | null>(null)
  const [model, setModel] = useState<CollectionsPageModel | null>(null)
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
      const [nextCollectionDocument, nextAllCollectionDocument, nextPaletteCollection, dictionaries] = await Promise.all([
        getCollectionsCollection(),
        getCollectionsCollection({ includeDeleted: true }),
        getPalettesCollection(),
        getDictionariesCollection(),
      ])
      const nextEditorOptions = toCollectionEditorOptions(nextPaletteCollection, dictionaries)
      const nextSelectedCollectionId = findSelectedCollectionId(
        nextCollectionDocument,
        selectedCollectionId,
      )
      const nextSelectedCollection = findSelectedCollection(
        nextCollectionDocument,
        nextSelectedCollectionId,
      )

      setCollectionDocument(nextCollectionDocument)
      setAllCollectionDocument(nextAllCollectionDocument)
      setPaletteCollection(nextPaletteCollection)
      setEditorOptions(nextEditorOptions)
      setSelectedCollectionId(nextSelectedCollectionId)
      setModel(
        toCollectionsPageModel(
          nextCollectionDocument,
          nextPaletteCollection,
          nextSelectedCollectionId,
          nextEditorOptions,
        ),
      )
      setDraft(cloneCollection(nextSelectedCollection))
    } catch {
      setErrorMessage('合集列表加载失败。请先启动 admin-api，再刷新页面。')
    } finally {
      setIsLoading(false)
    }
  }

  function onSelectCollection(id: string): void {
    if (!collectionDocument || !paletteCollection) {
      return
    }

    setSelectedCollectionId(id)
    setDeleteCheck(null)
    setDeleteReason('')
    setSaveMessage(null)
    setModel(toCollectionsPageModel(collectionDocument, paletteCollection, id, editorOptions))
    setDraft(cloneCollection(findSelectedCollection(collectionDocument, id)))
  }

  function onDeleteReasonChange(value: string): void {
    setDeleteReason(value)
  }

  function onDraftFieldChange<TField extends EditableScalarField>(
    field: TField,
    value: CollectionDto[TField],
  ): void {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      if (field === 'coverPaletteId' && typeof value === 'string') {
        return {
          ...currentDraft,
          coverPaletteId: value,
          paletteIds: currentDraft.paletteIds.includes(value)
            ? currentDraft.paletteIds
            : [...currentDraft.paletteIds, value],
        }
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

      if (field === 'paletteIds') {
        const nextPaletteIds = hasValue
          ? currentDraft.paletteIds.filter((currentValue) => currentValue !== value)
          : [...currentDraft.paletteIds, value]

        return buildDraftWithPaletteIds(currentDraft, nextPaletteIds)
      }

      return {
        ...currentDraft,
        [field]: hasValue
          ? currentDraft[field].filter((currentValue) => currentValue !== value)
          : [...currentDraft[field], value],
      }
    })
    setSaveMessage(null)
  }

  function onAddPaletteMember(paletteId: string): void {
    setDraft((currentDraft) => {
      if (!currentDraft || currentDraft.paletteIds.includes(paletteId)) {
        return currentDraft
      }

      return buildDraftWithPaletteIds(currentDraft, [...currentDraft.paletteIds, paletteId])
    })
    setSaveMessage(null)
  }

  function onMovePaletteMember(paletteId: string, direction: 'up' | 'down'): void {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      return {
        ...currentDraft,
        paletteIds: movePaletteId(currentDraft.paletteIds, paletteId, direction),
      }
    })
    setSaveMessage(null)
  }

  function onRemovePaletteMember(paletteId: string): void {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      return buildDraftWithPaletteIds(
        currentDraft,
        currentDraft.paletteIds.filter((currentValue) => currentValue !== paletteId),
      )
    })
    setSaveMessage(null)
  }

  function onSetCoverPalette(paletteId: string): void {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      return {
        ...currentDraft,
        coverPaletteId: paletteId,
        paletteIds: currentDraft.paletteIds.includes(paletteId)
          ? currentDraft.paletteIds
          : [...currentDraft.paletteIds, paletteId],
      }
    })
    setSaveMessage(null)
  }

  async function onSave(): Promise<void> {
    if (!draft || !paletteCollection) {
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const nextCollectionDocument = await updateCollection(draft.id, toUpdatePayload(draft))
      const nextAllCollectionDocument = await getCollectionsCollection({ includeDeleted: true })
      const nextSelectedCollection = findSelectedCollection(nextCollectionDocument, draft.id)

      setCollectionDocument(nextCollectionDocument)
      setAllCollectionDocument(nextAllCollectionDocument)
      setSelectedCollectionId(nextSelectedCollection?.id ?? nextCollectionDocument.items[0]?.id ?? null)
      setModel(toCollectionsPageModel(nextCollectionDocument, paletteCollection, draft.id, editorOptions))
      setDraft(cloneCollection(nextSelectedCollection))
      setSaveMessage('已写回 collections.v1.json。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Collection 保存失败。')
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
      const nextDeleteCheck = await getCollectionDeleteCheck(draft.id)

      setDeleteCheck(nextDeleteCheck)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Collection 删除检查失败。')
    } finally {
      setIsDeleteChecking(false)
    }
  }

  async function onDelete(): Promise<void> {
    if (!draft || !paletteCollection) {
      return
    }

    setIsDeleting(true)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const latestDeleteCheck = deleteCheck ?? (await getCollectionDeleteCheck(draft.id))

      setDeleteCheck(latestDeleteCheck)

      if (!latestDeleteCheck.canDelete) {
        setErrorMessage('当前 Collection 仍被 Palette 引用，不能执行软删除。')
        return
      }

      const nextCollectionDocument = await deleteCollection(draft.id, { deleteReason })
      const nextAllCollectionDocument = await getCollectionsCollection({ includeDeleted: true })
      const nextSelectedCollectionId = nextCollectionDocument.items[0]?.id ?? null
      const nextSelectedCollection = findSelectedCollection(
        nextCollectionDocument,
        nextSelectedCollectionId,
      )

      setCollectionDocument(nextCollectionDocument)
      setAllCollectionDocument(nextAllCollectionDocument)
      setSelectedCollectionId(nextSelectedCollectionId)
      setDeleteCheck(null)
      setDeleteReason('')
      setModel(
        toCollectionsPageModel(
          nextCollectionDocument,
          paletteCollection,
          nextSelectedCollectionId,
          editorOptions,
        ),
      )
      setDraft(cloneCollection(nextSelectedCollection))
      setSaveMessage('已执行 Collection 软删除，并写回 collections.v1.json。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Collection 软删除失败。')
    } finally {
      setIsDeleting(false)
    }
  }

  async function onRestore(id: string): Promise<void> {
    if (!paletteCollection) {
      return
    }

    setIsRestoringId(id)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const nextCollectionDocument = await restoreCollection(id)
      const nextAllCollectionDocument = await getCollectionsCollection({ includeDeleted: true })
      const nextSelectedCollection = findSelectedCollection(nextCollectionDocument, id)

      setCollectionDocument(nextCollectionDocument)
      setAllCollectionDocument(nextAllCollectionDocument)
      setSelectedCollectionId(nextSelectedCollection?.id ?? nextCollectionDocument.items[0]?.id ?? null)
      setModel(toCollectionsPageModel(nextCollectionDocument, paletteCollection, id, editorOptions))
      setDraft(cloneCollection(nextSelectedCollection))
      setSaveMessage('已恢复 Collection，并重新回到可编辑列表。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Collection 恢复失败。')
    } finally {
      setIsRestoringId(null)
    }
  }

  return {
    archivedCollections: getArchivedCollections(allCollectionDocument),
    deleteCheck,
    deleteReason,
    draft,
    editorOptions,
    errorMessage,
    isDeleteChecking,
    isDeleting,
    isLoading,
    isRestoringId,
    isSaving,
    model,
    onAddPaletteMember,
    onCheckDeleteRisk,
    onDelete,
    onDeleteReasonChange,
    onDraftFieldChange,
    onMovePaletteMember,
    onRemovePaletteMember,
    onDraftTagToggle,
    onRefresh,
    onRestore,
    onSave,
    onSelectCollection,
    onSetCoverPalette,
    saveMessage,
  }
}