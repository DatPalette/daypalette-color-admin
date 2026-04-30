import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card className="border-[var(--dp-border-hairline)] bg-white/90">
        <CardContent className="p-6 text-sm leading-6 text-muted-foreground">
          当前还没有可展示的基础色。
        </CardContent>
      </Card>
    )
  }

  const summary = [draft.tone, draft.colorFamily, draft.status].join(' · ')

  return (
    <Card className="border-[var(--dp-border-hairline)] bg-white/92">
      <div className="h-36 rounded-t-[28px]" style={{ backgroundColor: draft.hex }} />
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{draft.id || 'new-base-color'}</p>
            <CardTitle className="text-3xl">{isCreating ? '新增基础色' : '编辑基础色'}</CardTitle>
            <CardDescription className="text-sm">
              {isCreating ? '保存会创建新记录并写回 raw JSON 文件。' : '保存会直接回写到 raw JSON 文件。'}
            </CardDescription>
          </div>
          {!isCreating ? (
            <Button onClick={onCreateDraft} variant="outline">
              新增基础色
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 text-sm leading-6 text-foreground">
        {saveMessage ? (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {saveMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="rounded-[18px] bg-[var(--dp-bg-page)] px-4 py-3">
            <p className="uppercase tracking-[0.18em]">Hex</p>
            <p className="mt-2 text-sm text-foreground">{draft.hex}</p>
          </div>
          <div className="rounded-[18px] bg-[var(--dp-bg-page)] px-4 py-3">
            <p className="uppercase tracking-[0.18em]">Neutral Core</p>
            <p className="mt-2 text-sm text-foreground">{draft.isNeutralCore ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <SectionTitle>Summary</SectionTitle>
          <p>{summary}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
            label="Lightness"
            onChange={(value) => onDraftFieldChange('lightnessLevel', value)}
            options={editorOptions.lightnessLevels}
            value={draft.lightnessLevel}
          />
          <SelectInput
            label="Saturation"
            onChange={(value) => onDraftFieldChange('saturationLevel', value)}
            options={editorOptions.saturationLevels}
            value={draft.saturationLevel}
          />
        </div>

        <label className="flex items-center gap-3 rounded-[18px] border border-[var(--dp-border-hairline)] bg-[var(--dp-bg-page)] px-4 py-3">
          <input
            checked={draft.isNeutralCore}
            className="size-4 accent-[var(--dp-fill-inverse)]"
            onChange={(event) => onDraftFieldChange('isNeutralCore', event.target.checked)}
            type="checkbox"
          />
          <span>作为中性色核心保留</span>
        </label>

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

        <Button className="w-full" disabled={isSaving} onClick={() => void onSave()} variant="primary">
          {isSaving ? '正在保存…' : isCreating ? '创建基础色' : '保存基础色'}
        </Button>

        {!isCreating ? (
          <div className="space-y-4 rounded-[24px] border border-amber-200 bg-amber-50/70 p-4">
            <div className="space-y-2">
              <SectionTitle>Delete Guard</SectionTitle>
              <p className="text-sm leading-6 text-foreground">
                删除前会先检查 palette 引用。只有当前基础色不再被任何 active palette 使用时，才允许软删除。
              </p>
            </div>

            <TextInput label="删除原因" onChange={onDeleteReasonChange} value={deleteReason} />

            {deleteCheck ? (
              deleteCheck.canDelete ? (
                <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  当前未发现 palette 引用，可以执行软删除。
                </div>
              ) : (
                <div className="space-y-3 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                className="w-full"
                disabled={isDeleteChecking || isDeleting || !deleteCheck?.canDelete}
                onClick={() => void onDelete()}
                variant="outline"
              >
                {isDeleting ? '正在软删除…' : '软删除基础色'}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-3 rounded-[24px] border border-sky-200 bg-sky-50/70 p-4">
          <div className="space-y-2">
            <SectionTitle>Archived Base Colors</SectionTitle>
            <p className="text-sm leading-6 text-foreground">已软删除的基础色会出现在这里，恢复后会重新回到可编辑列表。</p>
          </div>

          {archivedBaseColors.length === 0 ? (
            <div className="rounded-[18px] border border-sky-100 bg-white/70 px-4 py-3 text-sm text-muted-foreground">
              当前没有已归档的基础色。
            </div>
          ) : (
            <div className="space-y-3">
              {archivedBaseColors.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-[18px] border border-sky-100 bg-white/80 px-4 py-3"
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
      </CardContent>
    </Card>
  )
}