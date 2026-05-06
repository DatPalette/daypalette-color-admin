import { useEffect, useState, type ReactElement } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { DictionaryNodeDto } from '@/models/dictionaries'

import {
  getDictionaryEntityScopeSummary,
  getDictionaryFieldMappingLabel,
  getDictionarySelectionModeLabel,
} from '../display'
import { SectionTitle, TextAreaInput, TextInput } from './DictionaryEditorControls'

export interface DictionarySettingsFormValue {
  descriptionEn: string
  descriptionZh: string
  labelEn: string
  labelZh: string
}

interface DictionarySettingsDrawerProps {
  dictionary: DictionaryNodeDto | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (value: DictionarySettingsFormValue) => Promise<boolean>
  saveMessage: string | null
}

export function DictionarySettingsDrawer({
  dictionary,
  isSaving,
  onClose,
  onSubmit,
  saveMessage,
}: DictionarySettingsDrawerProps): ReactElement {
  const [formValue, setFormValue] = useState<DictionarySettingsFormValue>({
    descriptionEn: '',
    descriptionZh: '',
    labelEn: '',
    labelZh: '',
  })

  useEffect(() => {
    setFormValue({
      descriptionEn: dictionary?.descriptionEn ?? '',
      descriptionZh: dictionary?.descriptionZh ?? '',
      labelEn: dictionary?.labelEn ?? '',
      labelZh: dictionary?.labelZh ?? '',
    })
  }, [dictionary])

  if (!dictionary) {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b border-[var(--dp-border-subtle)] px-6 py-5">
          <h2 className="display-font text-[1.75rem] leading-none tracking-[-0.03em] text-foreground">编辑字典</h2>
          <button className="text-[var(--dp-text-muted)] hover:text-foreground" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>
      </div>
    )
  }

  async function handleSubmit(): Promise<void> {
    const didSave = await onSubmit(formValue)

    if (didSave) {
      onClose()
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--dp-border-subtle)] px-6 py-5">
        <div className="space-y-2">
          <p className="label-caps text-[var(--dp-text-muted)]">{dictionary.key}</p>
          <h2 className="display-font text-[1.75rem] leading-none tracking-[-0.03em] text-foreground">编辑字典</h2>
          <p className="text-sm text-[var(--dp-text-muted)]">字典自身信息单独在这里维护，不再和字典项编辑混在一起。</p>
        </div>
        <button className="text-[var(--dp-text-muted)] hover:text-foreground" onClick={onClose} type="button">
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
        {saveMessage ? (
          <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{saveMessage}</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="中文标题"
            onChange={(value) => setFormValue((currentValue) => ({ ...currentValue, labelZh: value }))}
            value={formValue.labelZh}
          />
          <TextInput
            label="英文标题"
            onChange={(value) => setFormValue((currentValue) => ({ ...currentValue, labelEn: value }))}
            value={formValue.labelEn}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaInput
            label="中文说明"
            onChange={(value) => setFormValue((currentValue) => ({ ...currentValue, descriptionZh: value }))}
            value={formValue.descriptionZh}
          />
          <TextAreaInput
            label="英文说明"
            onChange={(value) => setFormValue((currentValue) => ({ ...currentValue, descriptionEn: value }))}
            value={formValue.descriptionEn}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-4">
            <p className="label-caps text-[var(--dp-text-muted)]">选择模式</p>
            <p className="mt-2 text-sm text-foreground">{getDictionarySelectionModeLabel(dictionary.selectionMode)}</p>
          </div>
          <div className="border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-4">
            <p className="label-caps text-[var(--dp-text-muted)]">应用范围</p>
            <p className="mt-2 text-sm text-foreground">{getDictionaryEntityScopeSummary(dictionary.entityScopes)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <SectionTitle>字段映射</SectionTitle>
          <div className="space-y-2 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] p-4 text-sm text-[var(--dp-text-muted)]">
            {dictionary.fieldMappings.map((fieldMapping) => (
              <div key={`${fieldMapping.entity}-${fieldMapping.field}`} className="flex items-center justify-between gap-3">
                <span>{getDictionaryFieldMappingLabel(fieldMapping.entity, fieldMapping.field)}</span>
                <span>{getDictionarySelectionModeLabel(fieldMapping.selectionMode)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-[var(--dp-border-subtle)] bg-white px-6 py-5">
        <Button className="flex-1" disabled={isSaving} onClick={() => void handleSubmit()} variant="primary">
          {isSaving ? '正在保存…' : '保存字典'}
        </Button>
      </div>
    </div>
  )
}