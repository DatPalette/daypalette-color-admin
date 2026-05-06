import { useMemo, useState, type ReactElement } from 'react'
import { RefreshCcw } from 'lucide-react'

import { DetailDrawer } from '@/components/workbench/DetailDrawer'
import { WorkbenchPageHeader } from '@/components/workbench/WorkbenchPageHeader'
import { Button } from '@/components/ui/button'
import type { DictionaryItemDto, DictionaryNodeDto } from '@/models/dictionaries'
import { DictionaryDeleteDialog } from './components/DictionaryDeleteDialog'
import { DictionaryItemCard } from './components/DictionaryItemCard'
import { DictionaryItemDialog, type DictionaryItemFormValue } from './components/DictionaryItemDialog'
import { DictionarySettingsDrawer, type DictionarySettingsFormValue } from './components/DictionarySettingsDrawer'
import { DictionaryTabCard } from './components/DictionaryTabCard'
import { useDictionariesPageViewModel } from './view-model/useDictionariesPageViewModel'
import { buildNewDictionaryItemDraft } from './view-model/helpers'

export interface DictionariesPageProps {
  activeDictionaryKey: string
  onActiveDictionaryKeyChange: (key: string) => void
}

// 字典管理页，负责切换当前字典并承接条目级增删改与恢复流程。
export function DictionariesPage({
  activeDictionaryKey,
  onActiveDictionaryKeyChange,
}: DictionariesPageProps): ReactElement {
  const [deleteTargetItemId, setDeleteTargetItemId] = useState<string | null>(null)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false)
  const [itemDialogMode, setItemDialogMode] = useState<'create' | 'edit'>('create')
  const [itemDialogTargetId, setItemDialogTargetId] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const {
    archivedItems,
    deleteCheck,
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
    onDeleteItem,
    onRefresh,
    onRestoreItem,
    onSave,
    onSelectDictionary,
    saveMessage,
  } = useDictionariesPageViewModel({ activeDictionaryKey, onActiveDictionaryKeyChange })

  const filteredItems = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase()
    const items = [...(draft?.items ?? [])]
      .filter((item) => !item.isDeleted)
      .sort((leftItem, rightItem) => leftItem.sortOrder - rightItem.sortOrder || leftItem.labelZh.localeCompare(rightItem.labelZh))

    if (!keyword) {
      return items
    }

    return items.filter((item) =>
      [item.id, item.labelZh, item.labelEn, item.descriptionZh, item.descriptionEn, ...(item.aliases ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }, [draft?.items, searchValue])

  const tabItems = model?.cards ?? []
  const activeTab = tabItems.find((card) => card.key === activeDictionaryKey) ?? tabItems[0] ?? null
  const currentItemTarget = draft?.items.find((item) => item.id === itemDialogTargetId) ?? null
  const deleteTargetItem = draft?.items.find((item) => item.id === deleteTargetItemId) ?? null
  const itemDialogInitialValue: DictionaryItemFormValue | null =
    itemDialogMode === 'create'
      ? draft
        ? {
            id: '',
            isActive: true,
            labelEn: '',
            labelZh: '',
            sortOrder: buildNewDictionaryItemDraft(draft).sortOrder,
          }
        : null
      : currentItemTarget
        ? {
            id: currentItemTarget.id,
            isActive: currentItemTarget.isActive,
            labelEn: currentItemTarget.labelEn,
            labelZh: currentItemTarget.labelZh,
            sortOrder: currentItemTarget.sortOrder,
          }
        : null

  async function handleDictionarySave(value: DictionarySettingsFormValue): Promise<boolean> {
    if (!draft) {
      return false
    }

    const nextDraft: DictionaryNodeDto = {
      ...draft,
      descriptionEn: value.descriptionEn,
      descriptionZh: value.descriptionZh,
      labelEn: value.labelEn,
      labelZh: value.labelZh,
    }

    return onSave(nextDraft)
  }

  async function handleItemSubmit(value: DictionaryItemFormValue): Promise<boolean> {
    if (!draft) {
      return false
    }

    if (itemDialogMode === 'create') {
      return onCreateItem({
        ...buildNewDictionaryItemDraft(draft),
        id: value.id,
        isActive: value.isActive,
        labelEn: value.labelEn,
        labelZh: value.labelZh,
        sortOrder: value.sortOrder,
      })
    }

    if (!currentItemTarget) {
      return false
    }

    const nextDraft: DictionaryNodeDto = {
      ...draft,
      items: draft.items.map((item) =>
        item.id === currentItemTarget.id
          ? {
              ...item,
              isActive: value.isActive,
              labelEn: value.labelEn,
              labelZh: value.labelZh,
              sortOrder: value.sortOrder,
            }
          : item,
      ),
    }

    return onSave(nextDraft)
  }

  async function handleDeleteConfirm(reason: string): Promise<boolean> {
    if (!deleteTargetItem) {
      return false
    }

    return onDeleteItem(deleteTargetItem.id, reason)
  }

  return (
    <div className="space-y-8 pb-12">
      <WorkbenchPageHeader
        actions={
          <>
            <Button onClick={() => void onRefresh()} size="sm" variant="ghost">
              <RefreshCcw className="size-4" />
              刷新
            </Button>
            <Button disabled={!draft} onClick={() => setIsSettingsDrawerOpen(true)} size="sm" variant="outline">
              编辑字典
            </Button>
            <Button
              disabled={!draft}
              onClick={() => {
                setItemDialogMode('create')
                setItemDialogTargetId(null)
                setIsItemDialogOpen(true)
              }}
              size="sm"
              variant="primary"
            >
              新增条目
            </Button>
          </>
        }
        archivedLabel={`${archivedItems.length} 项已归档`}
        description="通过统一的基础数据字典，维护标签、枚举与选项口径；字典切换用 Tabs，条目浏览用卡片视图，编辑与删除拆到独立界面。"
        onSearchChange={setSearchValue}
        searchPlaceholder="搜索当前字典项"
        searchValue={searchValue}
        title="基础数据"
        totalLabel={draft ? `${draft.items.length} 项当前条目` : model?.totalLabel ?? '读取中'}
        updatedAtLabel={model?.updatedAtLabel ?? '等待返回'}
      />

      {saveMessage ? (
        <div className="paper-card border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-700">{saveMessage}</div>
      ) : null}

      {errorMessage ? (
        <div className="paper-card border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">{errorMessage}</div>
      ) : null}

      <section className="space-y-6">
        <div className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {tabItems.map((card) => (
            <DictionaryTabCard
              key={card.key}
              isActive={card.key === activeDictionaryKey}
              model={card}
              onSelect={(nextKey) => {
                onSelectDictionary(nextKey)
                setSearchValue('')
                setDeleteTargetItemId(null)
                setIsItemDialogOpen(false)
                setIsSettingsDrawerOpen(false)
              }}
            />
          ))}
        </div>

        {draft && activeTab ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="paper-card bg-white px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="label-caps text-[var(--dp-text-muted)]">{draft.key}</p>
                  <h2 className="mt-3 text-xl font-semibold text-foreground">{draft.labelZh}</h2>
                  <p className="mt-1 text-sm text-[var(--dp-text-muted)]">{draft.labelEn}</p>
                </div>
                <Button onClick={() => setIsSettingsDrawerOpen(true)} size="sm" variant="outline">
                  编辑字典
                </Button>
              </div>

              <p className="mt-4 text-sm leading-7 text-[var(--dp-text-muted)]">
                {draft.descriptionZh || draft.descriptionEn || '当前字典还没有补充说明。'}
              </p>
            </div>

            <div className="paper-card grid gap-4 bg-white px-5 py-5 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <p className="label-caps text-[var(--dp-text-muted)]">Selection Mode</p>
                <p className="mt-2 text-sm text-foreground">{draft.selectionMode}</p>
              </div>
              <div>
                <p className="label-caps text-[var(--dp-text-muted)]">Entity Scopes</p>
                <p className="mt-2 text-sm text-foreground">{draft.entityScopes.join(' / ')}</p>
              </div>
              <div>
                <p className="label-caps text-[var(--dp-text-muted)]">Field Mappings</p>
                <p className="mt-2 text-sm text-foreground">{draft.fieldMappings.length} 项映射</p>
              </div>
              <div>
                <p className="label-caps text-[var(--dp-text-muted)]">Items</p>
                <p className="mt-2 text-sm text-foreground">{activeTab.itemCountLabel}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-b border-[var(--dp-border-subtle)] pb-4">
          <div>
            <p className="label-caps text-[var(--dp-text-muted)]">Items</p>
            <p className="mt-2 text-sm text-[var(--dp-text-muted)]">当前字典项以卡片视图展示，编辑与删除通过独立界面承载。</p>
          </div>
          <p className="text-sm text-[var(--dp-text-muted)]">{filteredItems.length} visible items</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredItems.map((item) => (
            <DictionaryItemCard
              key={item.id}
              item={item}
              onDelete={(itemId) => setDeleteTargetItemId(itemId)}
              onEdit={(itemId) => {
                setItemDialogMode('edit')
                setItemDialogTargetId(itemId)
                setIsItemDialogOpen(true)
              }}
            />
          ))}

          {isLoading && !draft
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="paper-card min-h-[220px] animate-pulse bg-white" />
              ))
            : null}

          {!isLoading && filteredItems.length === 0 ? (
            <div className="paper-card md:col-span-2 2xl:col-span-3 bg-white px-8 py-10 text-center text-sm leading-7 text-[var(--dp-text-muted)]">
              当前字典没有匹配搜索词的条目。调整关键词后重试。
            </div>
          ) : null}
        </div>

        <div className="space-y-4 border-t border-[var(--dp-border-subtle)] pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-caps text-[var(--dp-text-muted)]">Archived Items</p>
              <p className="mt-2 text-sm text-[var(--dp-text-muted)]">已软删除条目单独列出，避免和当前编辑中的 active items 混在一起。</p>
            </div>
            <p className="text-sm text-[var(--dp-text-muted)]">{archivedItems.length} archived</p>
          </div>

          {archivedItems.length === 0 ? (
            <div className="paper-card bg-white px-5 py-4 text-sm text-[var(--dp-text-muted)]">当前没有已归档的字典项。</div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {archivedItems.map((item) => (
                <div key={item.id} className="paper-card flex items-center justify-between gap-4 bg-white px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.labelZh || item.id}</p>
                    <p className="mt-1 text-xs text-[var(--dp-text-muted)]">
                      {item.id} / {item.deleteReason || '无删除原因'}
                    </p>
                  </div>
                  <Button
                    disabled={isRestoringItemId === item.id}
                    onClick={() => void onRestoreItem(item.id)}
                    variant="outline"
                  >
                    {isRestoringItemId === item.id ? '正在恢复…' : '恢复'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <DetailDrawer isOpen={isSettingsDrawerOpen && Boolean(draft)} onClose={() => setIsSettingsDrawerOpen(false)}>
        <DictionarySettingsDrawer
          dictionary={draft}
          isSaving={isSaving}
          onClose={() => setIsSettingsDrawerOpen(false)}
          onSubmit={handleDictionarySave}
          saveMessage={saveMessage}
        />
      </DetailDrawer>

      <DictionaryItemDialog
        dictionaryLabel={draft?.labelZh ?? '基础数据'}
        initialValue={itemDialogInitialValue}
        isOpen={isItemDialogOpen && Boolean(itemDialogInitialValue)}
        isSubmitting={itemDialogMode === 'create' ? isCreatingItem : isSaving}
        mode={itemDialogMode}
        onClose={() => {
          setIsItemDialogOpen(false)
          setItemDialogTargetId(null)
        }}
        onSubmit={handleItemSubmit}
      />

      <DictionaryDeleteDialog
        deleteCheck={deleteCheck}
        isChecking={Boolean(deleteTargetItemId) && isDeleteCheckingItemId === deleteTargetItemId}
        isDeleting={Boolean(deleteTargetItemId) && isDeletingItemId === deleteTargetItemId}
        isOpen={Boolean(deleteTargetItem)}
        item={deleteTargetItem as DictionaryItemDto | null}
        onCheckRisk={onCheckDeleteRisk}
        onClose={() => setDeleteTargetItemId(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}