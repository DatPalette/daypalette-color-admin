import { useEffect, useState, type ReactElement } from 'react'
import { X } from 'lucide-react'

import { WorkbenchModal } from '@/components/workbench/WorkbenchModal'
import { Button } from '@/components/ui/button'

import { SectionTitle, TextInput } from './DictionaryEditorControls'

export interface DictionaryItemFormValue {
  id: string
  isActive: boolean
  labelEn: string
  labelZh: string
  sortOrder: number
}

interface DictionaryItemDialogProps {
  dictionaryLabel: string
  initialValue: DictionaryItemFormValue | null
  isOpen: boolean
  isSubmitting: boolean
  mode: 'create' | 'edit'
  onClose: () => void
  onSubmit: (value: DictionaryItemFormValue) => Promise<boolean>
}

export function DictionaryItemDialog({
  dictionaryLabel,
  initialValue,
  isOpen,
  isSubmitting,
  mode,
  onClose,
  onSubmit,
}: DictionaryItemDialogProps): ReactElement {
  const [formValue, setFormValue] = useState<DictionaryItemFormValue>({
    id: '',
    isActive: true,
    labelEn: '',
    labelZh: '',
    sortOrder: 0,
  })

  useEffect(() => {
    if (initialValue) {
      setFormValue(initialValue)
    }
  }, [initialValue])

  async function handleSubmit(): Promise<void> {
    const didSave = await onSubmit(formValue)

    if (didSave) {
      onClose()
    }
  }

  return (
    <WorkbenchModal isOpen={isOpen} onClose={onClose} panelClassName="max-w-[560px]">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--dp-border-subtle)] px-6 py-5">
        <div className="space-y-2">
          <p className="label-caps text-[var(--dp-text-muted)]">{dictionaryLabel}</p>
          <h2 className="display-font text-[1.75rem] leading-none tracking-[-0.03em] text-foreground">
            {mode === 'create' ? '新增字典项' : '编辑字典项'}
          </h2>
        </div>
        <button className="text-[var(--dp-text-muted)] hover:text-foreground" onClick={onClose} type="button">
          <X className="size-5" />
        </button>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <SectionTitle>条目 ID</SectionTitle>
            <input
              className="w-full border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[var(--dp-fill-inverse)] disabled:cursor-not-allowed disabled:bg-[var(--dp-surface-high)]"
              disabled={mode === 'edit'}
              onChange={(event) => setFormValue((currentValue) => ({ ...currentValue, id: event.target.value }))}
              value={formValue.id}
            />
          </label>
          <label className="space-y-2">
            <SectionTitle>Sort Order</SectionTitle>
            <input
              className="w-full border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[var(--dp-fill-inverse)]"
              onChange={(event) =>
                setFormValue((currentValue) => ({
                  ...currentValue,
                  sortOrder: Number(event.target.value) || 0,
                }))
              }
              type="number"
              value={formValue.sortOrder}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="中文标签"
            onChange={(value) => setFormValue((currentValue) => ({ ...currentValue, labelZh: value }))}
            value={formValue.labelZh}
          />
          <TextInput
            label="英文标签"
            onChange={(value) => setFormValue((currentValue) => ({ ...currentValue, labelEn: value }))}
            value={formValue.labelEn}
          />
        </div>

        <label className="flex items-center gap-3 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-foreground">
          <input
            checked={formValue.isActive}
            className="size-4 accent-[var(--dp-fill-inverse)]"
            onChange={(event) => setFormValue((currentValue) => ({ ...currentValue, isActive: event.target.checked }))}
            type="checkbox"
          />
          启用当前字典项
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[var(--dp-border-subtle)] px-6 py-5">
        <Button onClick={onClose} variant="ghost">
          取消
        </Button>
        <Button disabled={isSubmitting} onClick={() => void handleSubmit()} variant="primary">
          {isSubmitting ? '正在保存…' : mode === 'create' ? '新增条目' : '保存条目'}
        </Button>
      </div>
    </WorkbenchModal>
  )
}