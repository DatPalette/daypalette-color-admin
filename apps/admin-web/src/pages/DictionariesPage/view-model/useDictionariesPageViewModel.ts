import { useEffect, useState } from 'react'

import type {
  DictionariesDocumentDto,
  DictionariesPageModel,
  DictionaryItemCreateDto,
  DictionaryItemDeleteCheckDto,
  DictionaryItemDto,
  DictionaryNodeDto,
} from '@/models/dictionaries'
import {
  createDictionaryItem,
  deleteDictionaryItem,
  getDictionariesCollection,
  getDictionaryItemDeleteCheck,
  restoreDictionaryItem,
  updateDictionary,
} from '@/services/dictionaries/dictionaries.service'
import { toDictionariesPageModel } from '@/transformers/dictionaries/dictionaries.transformer'
import {
  buildNewDictionaryItemDraft,
  cloneDictionaryNode,
  findSelectedDictionary,
  getArchivedDictionaryItems,
} from './helpers'

interface DictionariesPageViewModel {
  archivedItems: DictionaryItemDto[]
  createItemDraft: DictionaryItemCreateDto
  deleteCheck: DictionaryItemDeleteCheckDto | null
  deleteReasonByItemId: Record<string, string>
  draft: DictionaryNodeDto | null
  errorMessage: string | null
  isCreatingItem: boolean
  isDeleteCheckingItemId: string | null
  isDeletingItemId: string | null
  isLoading: boolean
  isRestoringItemId: string | null
  isSaving: boolean
  model: DictionariesPageModel | null
  onCheckDeleteRisk: (itemId: string) => Promise<void>
  onCreateItem: () => Promise<void>
  onCreateItemFieldChange: (
    field: 'id' | 'isActive' | 'labelEn' | 'labelZh' | 'sortOrder',
    value: boolean | number | string,
  ) => void
  onDeleteItem: (itemId: string) => Promise<void>
  onDictionaryFieldChange: (
    field: 'descriptionEn' | 'descriptionZh' | 'labelEn' | 'labelZh',
    value: string,
  ) => void
  onDictionaryItemDeleteReasonChange: (itemId: string, value: string) => void
  onDictionaryItemFieldChange: (
    itemId: string,
    field: 'isActive' | 'labelEn' | 'labelZh' | 'sortOrder',
    value: boolean | number | string,
  ) => void
  onRefresh: () => Promise<void>
  onRestoreItem: (itemId: string) => Promise<void>
  onSave: () => Promise<void>
  onSelectDictionary: (key: string) => void
  saveMessage: string | null
}

// 字典页面状态编排层，负责同步当前选中字典、条目草稿和条目级删除保护流程。
export function useDictionariesPageViewModel({
  activeDictionaryKey,
  onActiveDictionaryKeyChange,
}: {
  activeDictionaryKey: string
  onActiveDictionaryKeyChange: (key: string) => void
}): DictionariesPageViewModel {
  const [collection, setCollection] = useState<DictionariesDocumentDto | null>(null)
  const [allCollection, setAllCollection] = useState<DictionariesDocumentDto | null>(null)
  const [createItemDraft, setCreateItemDraft] = useState<DictionaryItemCreateDto>(buildNewDictionaryItemDraft(null))
  const [deleteCheck, setDeleteCheck] = useState<DictionaryItemDeleteCheckDto | null>(null)
  const [deleteReasonByItemId, setDeleteReasonByItemId] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState<DictionaryNodeDto | null>(null)
  const [isCreatingItem, setIsCreatingItem] = useState(false)
  const [isDeleteCheckingItemId, setIsDeleteCheckingItemId] = useState<string | null>(null)
  const [isDeletingItemId, setIsDeletingItemId] = useState<string | null>(null)
  const [model, setModel] = useState<DictionariesPageModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRestoringItemId, setIsRestoringItemId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    void onRefresh()
  }, [])

  useEffect(() => {
    const nextSelectedDictionary = findSelectedDictionary(collection, activeDictionaryKey)

    setDraft(cloneDictionaryNode(nextSelectedDictionary))
    setCreateItemDraft(buildNewDictionaryItemDraft(nextSelectedDictionary))
  }, [activeDictionaryKey, collection])

  async function onRefresh(): Promise<void> {
    setIsLoading(true)
    setDeleteCheck(null)
    setDeleteReasonByItemId({})
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const [nextCollection, nextAllCollection] = await Promise.all([
        getDictionariesCollection(),
        getDictionariesCollection({ includeDeleted: true }),
      ])
      const nextSelectedDictionary = findSelectedDictionary(nextCollection, activeDictionaryKey)

      setCollection(nextCollection)
      setAllCollection(nextAllCollection)
      setModel(toDictionariesPageModel(nextCollection))
      setDraft(cloneDictionaryNode(nextSelectedDictionary))
      setCreateItemDraft(buildNewDictionaryItemDraft(nextSelectedDictionary))

      if (nextSelectedDictionary) {
        onActiveDictionaryKeyChange(nextSelectedDictionary.key)
      }
    } catch {
      setErrorMessage('字典列表加载失败。请先启动 admin-api，再刷新页面。')
    } finally {
      setIsLoading(false)
    }
  }

  function onSelectDictionary(key: string): void {
    onActiveDictionaryKeyChange(key)
    setDeleteCheck(null)
    setDeleteReasonByItemId({})
    setSaveMessage(null)

    if (!collection) {
      return
    }

    const nextSelectedDictionary = findSelectedDictionary(collection, key)

    setDraft(cloneDictionaryNode(nextSelectedDictionary))
    setCreateItemDraft(buildNewDictionaryItemDraft(nextSelectedDictionary))
  }

  function onCreateItemFieldChange(
    field: 'id' | 'isActive' | 'labelEn' | 'labelZh' | 'sortOrder',
    value: boolean | number | string,
  ): void {
    setCreateItemDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }))
    setSaveMessage(null)
  }

  function onDictionaryItemDeleteReasonChange(itemId: string, value: string): void {
    setDeleteReasonByItemId((currentReasons) => ({
      ...currentReasons,
      [itemId]: value,
    }))
  }

  function onDictionaryFieldChange(
    field: 'descriptionEn' | 'descriptionZh' | 'labelEn' | 'labelZh',
    value: string,
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

  function onDictionaryItemFieldChange(
    itemId: string,
    field: 'isActive' | 'labelEn' | 'labelZh' | 'sortOrder',
    value: boolean | number | string,
  ): void {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      return {
        ...currentDraft,
        items: currentDraft.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                [field]: value,
              }
            : item,
        ),
      }
    })
    setSaveMessage(null)
  }

  async function onCheckDeleteRisk(itemId: string): Promise<void> {
    if (!draft) {
      return
    }

    setIsDeleteCheckingItemId(itemId)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const nextDeleteCheck = await getDictionaryItemDeleteCheck(draft.key, itemId)

      setDeleteCheck(nextDeleteCheck)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '字典项删除检查失败。')
    } finally {
      setIsDeleteCheckingItemId(null)
    }
  }

  async function onDeleteItem(itemId: string): Promise<void> {
    if (!draft) {
      return
    }

    setIsDeletingItemId(itemId)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const latestDeleteCheck =
        deleteCheck?.itemId === itemId
          ? deleteCheck
          : await getDictionaryItemDeleteCheck(draft.key, itemId)

      setDeleteCheck(latestDeleteCheck)

      if (!latestDeleteCheck.canDelete) {
        setErrorMessage('当前字典项仍被主数据引用，不能软删除。')
        return
      }

      const nextCollection = await deleteDictionaryItem(draft.key, itemId, {
        deleteReason: deleteReasonByItemId[itemId] ?? '',
      })
      const nextAllCollection = await getDictionariesCollection({ includeDeleted: true })
      const nextSelectedDictionary = findSelectedDictionary(nextCollection, draft.key)

      setCollection(nextCollection)
      setAllCollection(nextAllCollection)
      setModel(toDictionariesPageModel(nextCollection))
      setDraft(cloneDictionaryNode(nextSelectedDictionary))
      setCreateItemDraft(buildNewDictionaryItemDraft(nextSelectedDictionary))
      setDeleteCheck(null)
      setDeleteReasonByItemId((currentReasons) => {
        const nextReasons = { ...currentReasons }

        delete nextReasons[itemId]

        return nextReasons
      })
      setSaveMessage('已软删除字典项，并写回 dictionaries.v1.json。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '字典项软删除失败。')
    } finally {
      setIsDeletingItemId(null)
    }
  }

  async function onCreateItem(): Promise<void> {
    if (!draft) {
      return
    }

    setIsCreatingItem(true)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const nextCollection = await createDictionaryItem(draft.key, createItemDraft)
      const nextAllCollection = await getDictionariesCollection({ includeDeleted: true })
      const nextSelectedDictionary = findSelectedDictionary(nextCollection, draft.key)

      setCollection(nextCollection)
      setAllCollection(nextAllCollection)
      setModel(toDictionariesPageModel(nextCollection))
      setDraft(cloneDictionaryNode(nextSelectedDictionary))
      setCreateItemDraft(buildNewDictionaryItemDraft(nextSelectedDictionary))
      setSaveMessage('已新增字典项，并写回 dictionaries.v1.json。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '字典项新增失败。')
    } finally {
      setIsCreatingItem(false)
    }
  }

  async function onRestoreItem(itemId: string): Promise<void> {
    if (!draft) {
      return
    }

    setIsRestoringItemId(itemId)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const nextCollection = await restoreDictionaryItem(draft.key, itemId)
      const nextAllCollection = await getDictionariesCollection({ includeDeleted: true })
      const nextSelectedDictionary = findSelectedDictionary(nextCollection, draft.key)

      setCollection(nextCollection)
      setAllCollection(nextAllCollection)
      setModel(toDictionariesPageModel(nextCollection))
      setDraft(cloneDictionaryNode(nextSelectedDictionary))
      setCreateItemDraft(buildNewDictionaryItemDraft(nextSelectedDictionary))
      setSaveMessage('已恢复字典项，并重新回到可编辑列表。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '字典项恢复失败。')
    } finally {
      setIsRestoringItemId(null)
    }
  }

  async function onSave(): Promise<void> {
    if (!draft) {
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setSaveMessage(null)

    try {
      const nextCollection = await updateDictionary(draft.key, draft)
      const nextAllCollection = await getDictionariesCollection({ includeDeleted: true })
      const nextSelectedDictionary = findSelectedDictionary(nextCollection, draft.key)

      setCollection(nextCollection)
      setAllCollection(nextAllCollection)
      setModel(toDictionariesPageModel(nextCollection))
      setDraft(cloneDictionaryNode(nextSelectedDictionary))
      setCreateItemDraft(buildNewDictionaryItemDraft(nextSelectedDictionary))
      setSaveMessage('已写回 dictionaries.v1.json。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '字典保存失败。')
    } finally {
      setIsSaving(false)
    }
  }

  return {
    archivedItems: getArchivedDictionaryItems(allCollection, activeDictionaryKey),
    createItemDraft,
    deleteCheck,
    deleteReasonByItemId,
    draft,
    errorMessage,
    isCreatingItem,
    isDeleteCheckingItemId,
    isDeletingItemId,
    isLoading,
    isRestoringItemId,
    isSaving,
    model,
    onCheckDeleteRisk,
    onCreateItem,
    onCreateItemFieldChange,
    onDeleteItem,
    onDictionaryFieldChange,
    onDictionaryItemDeleteReasonChange,
    onDictionaryItemFieldChange,
    onRefresh,
    onRestoreItem,
    onSave,
    onSelectDictionary,
    saveMessage,
  }
}