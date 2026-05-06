import type { ReactElement } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { BaseColorDeleteCheckDto, BaseColorDto, BaseColorEditorOptions } from '@/models/base-colors'

import { MultiSelectChips, SectionTitle, SelectInput, TextInput } from './BaseColorEditorControls'

// 基础色详情面板，负责编排编辑表单、删除保护和归档恢复区块。
export function BaseColorDetailPanel({
  archivedBaseColors,
  deleteCheck,
  deleteReason,
  draft,
  editorOptions,
  isDeleteChecking,
  isCreating,
  isDeleting,
  isRestoringId,
  isSaving,
  onCreateDraft,
  onCheckDeleteRisk,
  onClose,
  onDelete,
  onDeleteReasonChange,
  onDraftFieldChange,
  onDraftTagToggle,
  onRestore,
  onSave,
  saveMessage,
}: {
  archivedBaseColors: BaseColorDto[]
  deleteCheck: BaseColorDeleteCheckDto | null
  deleteReason: string
  draft: BaseColorDto | null
  editorOptions: BaseColorEditorOptions | null
  isDeleteChecking: boolean
  isCreating: boolean
  isDeleting: boolean
  isRestoringId: string | null
  isSaving: boolean
  onCreateDraft: () => void
  onCheckDeleteRisk: () => Promise<void>
  onClose: () => void
  onDelete: () => Promise<void>
  onDeleteReasonChange: (value: string) => void
  onDraftFieldChange: (
    field:
      | 'colorFamily'
      | 'hex'
      | 'id'
      | 'isNeutralCore'
      | 'lightnessLevel'
      | 'nameEn'
      | 'nameZh'
      | 'saturationLevel'
      | 'status'
      | 'tone',
    value: string | boolean,
  ) => void
  onDraftTagToggle: (field: 'occasionTags' | 'seasonTags' | 'styleTags', value: string) => void
  onRestore: (id: string) => Promise<void>
  onSave: () => Promise<void>
  saveMessage: string | null
}): ReactElement {
  if (!draft || !editorOptions) {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b border-[var(--dp-border-subtle)] px-6 py-5">
          <h2 className="display-font text-[2rem] leading-none tracking-[-0.03em] text-foreground">编辑颜色资产</h2>
          <button className="text-muted-foreground hover:text-foreground" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-6 text-sm leading-6 text-muted-foreground">当前还没有可展示的基础色。</div>
      </div>
    )
  }

  const summary = [draft.tone, draft.colorFamily, draft.status].join(' · ')

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--dp-border-subtle)] px-6 py-5">
        <div className="space-y-2">
          <p className="label-caps text-muted-foreground">{draft.id || 'new-base-color'}</p>
          <h2 className="display-font text-[2rem] leading-none tracking-[-0.03em] text-foreground">编辑颜色资产</h2>
          <p className="text-sm text-muted-foreground">
            {isCreating ? '保存会创建新记录并写回 raw JSON 文件。' : '保存会直接回写到 raw JSON 文件。'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCreating ? (
            <Button onClick={onCreateDraft} size="sm" variant="ghost">
              新增
            </Button>
          ) : null}
          <button className="text-muted-foreground hover:text-foreground" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 text-sm leading-6 text-foreground">
        {saveMessage ? (
          <div className="mb-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {saveMessage}
          </div>
        ) : null}

        <section className="space-y-3 border-b border-[var(--dp-border-subtle)] pb-8">
          <SectionTitle>Color Value</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
            <div className="h-24 border border-black/5" style={{ backgroundColor: draft.hex }} />
            <div className="space-y-2">
              <input
                className="w-full border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[var(--dp-fill-inverse)]"
                onChange={(event) => onDraftFieldChange('hex', event.target.value)}
                value={draft.hex}
              />
              <p className="text-xs italic text-muted-foreground">Ref: curated base color sample</p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 border-b border-[var(--dp-border-subtle)] py-8 sm:grid-cols-2">
          <div>
            <SectionTitle>Chinese Name</SectionTitle>
            <p className="mt-2 text-[1.9rem] leading-none tracking-[-0.03em] text-foreground">{draft.nameZh}</p>
          </div>
          <div>
            <SectionTitle>English Name</SectionTitle>
            <p className="mt-2 text-lg text-muted-foreground">{draft.nameEn}</p>
          </div>
        </div>

        <div className="space-y-2 border-b border-[var(--dp-border-subtle)] py-8">
          <SectionTitle>Summary</SectionTitle>
          <p className="text-sm leading-7 text-muted-foreground">{summary}</p>
        </div>

        <div className="grid gap-4 border-b border-[var(--dp-border-subtle)] py-8 md:grid-cols-2">
          <TextInput
            disabled={!isCreating}
            label="ID"
            onChange={(value) => onDraftFieldChange('id', value)}
            value={draft.id}
          />
          <TextInput label="中文名" onChange={(value) => onDraftFieldChange('nameZh', value)} value={draft.nameZh} />
          <TextInput label="英文名" onChange={(value) => onDraftFieldChange('nameEn', value)} value={draft.nameEn} />
          <TextInput label="Hex" onChange={(value) => onDraftFieldChange('hex', value)} value={draft.hex} />
          <SelectInput
            label="Tone"
            onChange={(value) => onDraftFieldChange('tone', value)}
            options={editorOptions.tones}
            value={draft.tone}
          />
          <SelectInput
            label="Color Family"
            onChange={(value) => onDraftFieldChange('colorFamily', value)}
            options={editorOptions.colorFamilies}
            value={draft.colorFamily}
          />
          <SelectInput
            label="Status"
            onChange={(value) => onDraftFieldChange('status', value)}
            options={editorOptions.statuses}
            value={draft.status}
          />
          <SelectInput
            label="Saturation"
            onChange={(value) => onDraftFieldChange('saturationLevel', value)}
            options={editorOptions.saturationLevels}
            value={draft.saturationLevel}
          />
          <SelectInput
            label="Lightness"
            onChange={(value) => onDraftFieldChange('lightnessLevel', value)}
            options={editorOptions.lightnessLevels}
            value={draft.lightnessLevel}
          />
        </div>

        <label className="my-8 flex items-center justify-between gap-3 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3">
          <div>
            <SectionTitle>Neutral Core</SectionTitle>
            <p className="mt-1 text-sm text-muted-foreground">用于保留基础中性色，不随普通色卡一同淘汰。</p>
          </div>
          <input
            checked={draft.isNeutralCore}
            className="size-4 accent-[var(--dp-fill-inverse)]"
            onChange={(event) => onDraftFieldChange('isNeutralCore', event.target.checked)}
            type="checkbox"
          />
        </label>

        <div className="space-y-6 border-b border-[var(--dp-border-subtle)] pb-8">
          <MultiSelectChips
            label="Style Tags"
            onToggle={(value) => onDraftTagToggle('styleTags', value)}
            options={editorOptions.styleTags}
            selectedValues={draft.styleTags}
          />

          <MultiSelectChips
            label="Occasion Tags"
            onToggle={(value) => onDraftTagToggle('occasionTags', value)}
            options={editorOptions.occasionTags}
            selectedValues={draft.occasionTags}
          />

          <MultiSelectChips
            label="Season Tags"
            onToggle={(value) => onDraftTagToggle('seasonTags', value)}
            options={editorOptions.seasonTags}
            selectedValues={draft.seasonTags}
          />
        </div>

        {!isCreating ? (
          <div className="space-y-4 border-b border-[var(--dp-border-subtle)] py-8">
            <div className="space-y-2">
              <SectionTitle>Delete Guard</SectionTitle>
              <p className="text-sm leading-6 text-foreground">
                删除前会先检查 palette 引用。只有当前基础色不再被任何 active palette 使用时，才允许软删除。
              </p>
            </div>

            <TextInput label="删除原因" onChange={onDeleteReasonChange} value={deleteReason} />

            {deleteCheck ? (
              deleteCheck.canDelete ? (
                <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  当前未发现 palette 引用，可以执行软删除。
                </div>
              ) : (
                <div className="space-y-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <p>当前基础色仍被以下 palette 引用，不能软删除：</p>
                  <div className="space-y-2 text-xs leading-5">
                    {deleteCheck.blockingReferences.map((reference) => (
                      <div key={`${reference.id}-${reference.referenceField}`}>
                        {reference.id} / {reference.slug} / {reference.referenceField}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <Button
                className="w-full"
                disabled={isDeleteChecking || isDeleting}
                onClick={() => void onCheckDeleteRisk()}
                variant="outline"
              >
                {isDeleteChecking ? '正在检查…' : '检查删除风险'}
              </Button>
              <Button
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
                disabled={isDeleteChecking || isDeleting || !deleteCheck?.canDelete}
                onClick={() => void onDelete()}
                variant="outline"
              >
                {isDeleting ? '正在软删除…' : '软删除基础色'}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-3 py-8">
          <div className="space-y-2">
            <SectionTitle>Archived Base Colors</SectionTitle>
            <p className="text-sm leading-6 text-foreground">已软删除的基础色会出现在这里，恢复后会重新回到可编辑列表。</p>
          </div>

          {archivedBaseColors.length === 0 ? (
            <div className="border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-muted-foreground">
              当前没有已归档的基础色。
            </div>
          ) : (
            <div className="space-y-3">
              {archivedBaseColors.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.nameZh || item.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.id} / {item.deleteReason || '无删除原因'}
                    </p>
                  </div>
                  <Button
                    disabled={isRestoringId === item.id}
                    onClick={() => void onRestore(item.id)}
                    variant="outline"
                  >
                    {isRestoringId === item.id ? '正在恢复…' : '恢复'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--dp-border-subtle)] bg-white px-6 py-5">
        <div className="flex items-center gap-3">
          {!isCreating ? (
            <Button className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => void onCheckDeleteRisk()} variant="outline">
              检查删除风险
            </Button>
          ) : null}
          <Button className="flex-1" disabled={isSaving} onClick={() => void onSave()} variant="primary">
            {isSaving ? '正在保存…' : isCreating ? '创建基础色' : '保存基础色'}
          </Button>
        </div>
      </div>
    </div>
  )
}