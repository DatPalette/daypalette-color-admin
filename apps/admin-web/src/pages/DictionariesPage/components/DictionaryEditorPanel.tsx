import type { ReactElement } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type {
  DictionaryItemCreateDto,
  DictionaryItemDeleteCheckDto,
  DictionaryItemDto,
  DictionaryNodeDto,
} from '@/models/dictionaries'

import { SectionTitle, TextAreaInput, TextInput } from './DictionaryEditorControls'

// 字典编辑面板，负责编排字典基础信息、条目编辑、新增、删除保护和恢复区块。
export function DictionaryEditorPanel({
  archivedItems,
  createItemDraft,
  deleteCheck,
  deleteReasonByItemId,
  draft,
  isCreatingItem,
  isDeleteCheckingItemId,
  isDeletingItemId,
  isRestoringItemId,
  isSaving,
  onCheckDeleteRisk,
  onClose,
  onCreateItem,
  onCreateItemFieldChange,
  onDeleteItem,
  onDictionaryFieldChange,
  onDictionaryItemDeleteReasonChange,
  onDictionaryItemFieldChange,
  onRestoreItem,
  onSave,
  saveMessage,
}: {
  archivedItems: DictionaryItemDto[]
  createItemDraft: DictionaryItemCreateDto
  deleteCheck: DictionaryItemDeleteCheckDto | null
  deleteReasonByItemId: Record<string, string>
  draft: DictionaryNodeDto | null
  isCreatingItem: boolean
  isDeleteCheckingItemId: string | null
  isDeletingItemId: string | null
  isRestoringItemId: string | null
  isSaving: boolean
  onCheckDeleteRisk: (itemId: string) => Promise<void>
  onClose: () => void
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
  onRestoreItem: (itemId: string) => Promise<void>
  onSave: () => Promise<void>
  saveMessage: string | null
}): ReactElement {
  if (!draft) {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b border-[var(--dp-border-subtle)] px-6 py-5">
          <h2 className="display-font text-[2rem] leading-none tracking-[-0.03em] text-foreground">Edit Dictionary</h2>
          <button className="text-muted-foreground hover:text-foreground" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-6 text-sm leading-6 text-muted-foreground">当前还没有可编辑的字典。</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--dp-border-subtle)] px-6 py-5">
        <div className="space-y-2">
          <p className="label-caps text-muted-foreground">{draft.key}</p>
          <h2 className="display-font text-[2rem] leading-none tracking-[-0.03em] text-foreground">Edit Dictionary</h2>
          <p className="text-sm text-muted-foreground">当前先开放字典标题、说明和条目标签编辑。</p>
        </div>
        <button className="text-muted-foreground hover:text-foreground" onClick={onClose} type="button">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 text-sm leading-6 text-foreground">
        {saveMessage ? (
          <div className="mb-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {saveMessage}
          </div>
        ) : null}

        <div className="grid gap-4 border-b border-[var(--dp-border-subtle)] pb-8 md:grid-cols-2">
          <TextInput label="中文标题" onChange={(value) => onDictionaryFieldChange('labelZh', value)} value={draft.labelZh} />
          <TextInput label="英文标题" onChange={(value) => onDictionaryFieldChange('labelEn', value)} value={draft.labelEn} />
        </div>

        <div className="grid gap-4 border-b border-[var(--dp-border-subtle)] py-8 md:grid-cols-2">
          <TextAreaInput
            label="中文说明"
            onChange={(value) => onDictionaryFieldChange('descriptionZh', value)}
            value={draft.descriptionZh ?? ''}
          />
          <TextAreaInput
            label="英文说明"
            onChange={(value) => onDictionaryFieldChange('descriptionEn', value)}
            value={draft.descriptionEn ?? ''}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 border-b border-[var(--dp-border-subtle)] py-8 text-xs text-muted-foreground">
          <div className="border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3">
            <p className="label-caps">Selection Mode</p>
            <p className="mt-2 text-sm text-foreground">{draft.selectionMode}</p>
          </div>
          <div className="border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3">
            <p className="label-caps">Entity Scopes</p>
            <p className="mt-2 text-sm text-foreground">{draft.entityScopes.join(', ')}</p>
          </div>
        </div>

        <div className="space-y-3 border-b border-[var(--dp-border-subtle)] py-8">
          <SectionTitle>Field Mappings</SectionTitle>
          <div className="space-y-2 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] p-4 text-sm text-muted-foreground">
            {draft.fieldMappings.map((fieldMapping) => (
              <div key={`${fieldMapping.entity}-${fieldMapping.field}`} className="flex items-center justify-between gap-3">
                <span>
                  {fieldMapping.entity}.{fieldMapping.field}
                </span>
                <span>{fieldMapping.selectionMode}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 py-8">
          <SectionTitle>Items</SectionTitle>
          <div className="space-y-3 border border-sky-200 bg-sky-50/70 p-4">
            <div className="space-y-2">
              <SectionTitle>Create Item</SectionTitle>
              <p className="text-sm leading-6 text-foreground">当前先开放字典项新增的最小入口：ID、标签、启用状态和排序。</p>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <TextInput
                label="条目 ID"
                onChange={(value) => onCreateItemFieldChange('id', value)}
                value={createItemDraft.id}
              />
              <label className="flex items-center gap-2 border border-[var(--dp-border-subtle)] bg-white px-4 py-3 text-sm text-foreground md:self-end">
                <input
                  checked={createItemDraft.isActive}
                  className="size-4 accent-[var(--dp-fill-inverse)]"
                  onChange={(event) => onCreateItemFieldChange('isActive', event.target.checked)}
                  type="checkbox"
                />
                Active
              </label>
              <TextInput
                label="中文标签"
                onChange={(value) => onCreateItemFieldChange('labelZh', value)}
                value={createItemDraft.labelZh}
              />
              <TextInput
                label="英文标签"
                onChange={(value) => onCreateItemFieldChange('labelEn', value)}
                value={createItemDraft.labelEn}
              />
              <label className="space-y-2 md:max-w-[160px]">
                <SectionTitle>Sort Order</SectionTitle>
                <input
                  className="w-full border border-[var(--dp-border-subtle)] bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[var(--dp-fill-inverse)]"
                  onChange={(event) => onCreateItemFieldChange('sortOrder', Number(event.target.value) || 0)}
                  type="number"
                  value={createItemDraft.sortOrder}
                />
              </label>
            </div>

            <Button className="w-full" disabled={isCreatingItem} onClick={() => void onCreateItem()} variant="outline">
              {isCreatingItem ? '正在新增…' : '新增字典项'}
            </Button>
          </div>

          <div className="max-h-[52svh] space-y-3 overflow-y-auto pr-1">
            {draft.items.map((item) => (
              <div key={item.id} className="space-y-3 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="label-caps text-muted-foreground">{item.id}</p>
                    <p className="text-sm text-muted-foreground">
                      aliases: {item.aliases?.length ? item.aliases.join(', ') : 'none'}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      checked={item.isActive}
                      className="size-4 accent-[var(--dp-fill-inverse)]"
                      onChange={(event) =>
                        onDictionaryItemFieldChange(item.id, 'isActive', event.target.checked)
                      }
                      type="checkbox"
                    />
                    Active
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px]">
                  <TextInput
                    label="中文标签"
                    onChange={(value) => onDictionaryItemFieldChange(item.id, 'labelZh', value)}
                    value={item.labelZh}
                  />
                  <TextInput
                    label="英文标签"
                    onChange={(value) => onDictionaryItemFieldChange(item.id, 'labelEn', value)}
                    value={item.labelEn}
                  />
                  <label className="space-y-2">
                    <SectionTitle>Sort Order</SectionTitle>
                    <input
                      className="w-full border border-[var(--dp-border-subtle)] bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[var(--dp-fill-inverse)]"
                      onChange={(event) =>
                        onDictionaryItemFieldChange(item.id, 'sortOrder', Number(event.target.value) || 0)
                      }
                      type="number"
                      value={item.sortOrder}
                    />
                  </label>
                </div>

                <div className="space-y-3 border border-amber-200 bg-amber-50/70 p-4">
                  <SectionTitle>Delete Guard</SectionTitle>
                  <TextInput
                    label="删除原因"
                    onChange={(value) => onDictionaryItemDeleteReasonChange(item.id, value)}
                    value={deleteReasonByItemId[item.id] ?? ''}
                  />

                  {deleteCheck?.itemId === item.id ? (
                    deleteCheck.canDelete ? (
                      <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        当前未发现主数据引用，可以执行软删除。
                      </div>
                    ) : (
                      <div className="space-y-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <p>当前字典项仍被以下记录引用，不能软删除：</p>
                        <div className="space-y-2 text-xs leading-5">
                          {deleteCheck.blockingReferences.map((reference) => (
                            <div key={`${reference.resource}-${reference.id}-${reference.referenceField}`}>
                              {reference.resource} / {reference.id} / {reference.displayLabel} / {reference.referenceField}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-2">
                    <Button
                      className="w-full"
                      disabled={isDeleteCheckingItemId === item.id || isDeletingItemId === item.id}
                      onClick={() => void onCheckDeleteRisk(item.id)}
                      variant="outline"
                    >
                      {isDeleteCheckingItemId === item.id ? '正在检查…' : '检查删除风险'}
                    </Button>
                    <Button
                      className="w-full border-red-300 text-red-700 hover:bg-red-50"
                      disabled={
                        isDeleteCheckingItemId === item.id ||
                        isDeletingItemId === item.id ||
                        (deleteCheck?.itemId === item.id ? !deleteCheck.canDelete : false)
                      }
                      onClick={() => void onDeleteItem(item.id)}
                      variant="outline"
                    >
                      {isDeletingItemId === item.id ? '正在软删除…' : '软删除字典项'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 border border-sky-200 bg-sky-50/70 p-4">
          <div className="space-y-2">
            <SectionTitle>Archived Items</SectionTitle>
            <p className="text-sm leading-6 text-foreground">已软删除的字典项会显示在这里，恢复后会重新回到当前字典的可编辑列表。</p>
          </div>

          {archivedItems.length === 0 ? (
            <div className="border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-muted-foreground">
              当前没有已归档的字典项。
            </div>
          ) : (
            <div className="space-y-3">
              {archivedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.labelZh || item.id}</p>
                    <p className="text-xs text-muted-foreground">
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

        <Button className="w-full" disabled={isSaving} onClick={() => void onSave()} variant="primary">
          {isSaving ? '正在保存…' : '保存字典'}
        </Button>
      </div>
    </div>
  )
}