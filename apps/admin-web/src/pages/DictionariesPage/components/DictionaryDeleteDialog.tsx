import { useEffect, useState, type ReactElement } from 'react'
import { X } from 'lucide-react'

import { WorkbenchModal } from '@/components/workbench/WorkbenchModal'
import { Button } from '@/components/ui/button'
import type { DictionaryItemDeleteCheckDto, DictionaryItemDto } from '@/models/dictionaries'

import { SectionTitle } from './DictionaryEditorControls'

interface DictionaryDeleteDialogProps {
  deleteCheck: DictionaryItemDeleteCheckDto | null
  isChecking: boolean
  isDeleting: boolean
  isOpen: boolean
  item: DictionaryItemDto | null
  onCheckRisk: (itemId: string) => Promise<void>
  onClose: () => void
  onConfirm: (reason: string) => Promise<boolean>
}

export function DictionaryDeleteDialog({
  deleteCheck,
  isChecking,
  isDeleting,
  isOpen,
  item,
  onCheckRisk,
  onClose,
  onConfirm,
}: DictionaryDeleteDialogProps): ReactElement {
  const [deleteReason, setDeleteReason] = useState('')
  const activeDeleteCheck = deleteCheck?.itemId === item?.id ? deleteCheck : null

  useEffect(() => {
    setDeleteReason('')
  }, [item?.id])

  useEffect(() => {
    if (isOpen && item) {
      void onCheckRisk(item.id)
    }
  }, [isOpen, item?.id])

  async function handleConfirm(): Promise<void> {
    const didDelete = await onConfirm(deleteReason)

    if (didDelete) {
      onClose()
    }
  }

  return (
    <WorkbenchModal isOpen={isOpen} onClose={onClose} panelClassName="max-w-[560px]">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--dp-border-subtle)] px-6 py-5">
        <div className="space-y-2">
          <p className="label-caps text-[var(--dp-text-muted)]">Delete Item</p>
          <h2 className="display-font text-[1.75rem] leading-none tracking-[-0.03em] text-foreground">软删除确认</h2>
          <p className="text-sm text-[var(--dp-text-muted)]">{item ? `${item.labelZh} (${item.id})` : '未选择条目'}</p>
        </div>
        <button className="text-[var(--dp-text-muted)] hover:text-foreground" onClick={onClose} type="button">
          <X className="size-5" />
        </button>
      </div>

      <div className="space-y-5 px-6 py-6">
        <label className="space-y-2">
          <SectionTitle>删除原因</SectionTitle>
          <textarea
            className="min-h-[96px] w-full border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[var(--dp-fill-inverse)]"
            onChange={(event) => setDeleteReason(event.target.value)}
            placeholder="说明删除原因，便于后续追踪恢复。"
            value={deleteReason}
          />
        </label>

        {isChecking ? (
          <div className="border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-[var(--dp-text-muted)]">
            正在检查主数据引用...
          </div>
        ) : activeDeleteCheck ? (
          activeDeleteCheck.canDelete ? (
            <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              当前未发现主数据引用，可以执行软删除。
            </div>
          ) : (
            <div className="space-y-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>当前字典项仍被以下记录引用，不能软删除：</p>
              <div className="space-y-2 text-xs leading-5">
                {activeDeleteCheck.blockingReferences.map((reference) => (
                  <div key={`${reference.resource}-${reference.id}-${reference.referenceField}`}>
                    {reference.resource} / {reference.id} / {reference.displayLabel} / {reference.referenceField}
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-[var(--dp-text-muted)]">
            等待删除检查结果...
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--dp-border-subtle)] px-6 py-5">
        <Button onClick={onClose} variant="ghost">
          取消
        </Button>
        <Button
          className="border-red-300 text-red-700 hover:bg-red-50"
          disabled={
            isChecking ||
            isDeleting ||
            !activeDeleteCheck?.canDelete
          }
          onClick={() => void handleConfirm()}
          variant="outline"
        >
          {isDeleting ? '正在软删除…' : '确认软删除'}
        </Button>
      </div>
    </WorkbenchModal>
  )
}