import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { WorkbenchInfoRow } from '@/components/workbench/WorkbenchInfoRow'
import { buildOptionLabelMap, getBooleanLabel, resolveOptionLabel } from '@/utils/asset-display'
import { CollectionPaletteArrangement } from './CollectionPaletteArrangement'
import {
  MultiSelectChips,
  SectionTitle,
  SelectInput,
  TextAreaInput,
  TextInput,
} from './CollectionEditorControls'
import type {
  CollectionDeleteCheckDto,
  CollectionDto,
  CollectionEditorOptions,
} from '@/models/collections'

// Collection 摘要区，负责展示只读元信息和关键封面配置。
export function CollectionSummarySection({
  draft,
  editorOptions,
}: {
  draft: CollectionDto
  editorOptions: CollectionEditorOptions
}): ReactElement {
  const paletteLabelMap = buildOptionLabelMap(editorOptions.paletteOptions)
  const releaseModeLabelMap = buildOptionLabelMap(editorOptions.releaseModeOptions)
  const statusLabelMap = buildOptionLabelMap(editorOptions.statusOptions)
  const themeTypeLabelMap = buildOptionLabelMap(editorOptions.themeTypeOptions)
  const coverPreview = ['var(--dp-palette-main)', 'var(--dp-palette-secondary)', '#aa9b94', '#7d6f68']

  return (
    <div className="space-y-4 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] p-4">
      <div className="grid grid-cols-4 overflow-hidden border border-black/5">
        {coverPreview.map((color) => (
          <div key={color} className="h-16" style={{ backgroundColor: color }} />
        ))}
      </div>
      <div className="border border-[var(--dp-border-subtle)] bg-white px-5 py-3">
        <WorkbenchInfoRow label="合集 ID" value={draft.id} />
        <WorkbenchInfoRow label="主题类型" value={resolveOptionLabel(themeTypeLabelMap, draft.themeType)} />
        <WorkbenchInfoRow label="封面配色盘" value={resolveOptionLabel(paletteLabelMap, draft.coverPaletteId)} />
        <WorkbenchInfoRow label="发布模式" value={resolveOptionLabel(releaseModeLabelMap, draft.releaseMode)} />
        <WorkbenchInfoRow label="状态" value={resolveOptionLabel(statusLabelMap, draft.status)} />
        <WorkbenchInfoRow label="专业版" value={getBooleanLabel(draft.isPro)} />
      </div>
    </div>
  )
}

// Collection 编辑区，负责承接字段编辑、成员编排、标签选择和保存动作。
export function CollectionFormSection({
  draft,
  editorOptions,
  isSaving,
  onAddPaletteMember,
  onDraftFieldChange,
  onDraftTagToggle,
  onMovePaletteMember,
  onRemovePaletteMember,
  onSave,
  onSetCoverPalette,
}: {
  draft: CollectionDto
  editorOptions: CollectionEditorOptions
  isSaving: boolean
  onAddPaletteMember: (paletteId: string) => void
  onDraftFieldChange: (
    field:
      | 'coverPaletteId'
      | 'descriptionEn'
      | 'descriptionZh'
      | 'isPro'
      | 'nameEn'
      | 'nameZh'
      | 'releaseMode'
      | 'status'
      | 'themeType',
    value: boolean | string,
  ) => void
  onDraftTagToggle: (field: 'occasionTags' | 'paletteIds' | 'styleTags', value: string) => void
  onMovePaletteMember: (paletteId: string, direction: 'up' | 'down') => void
  onRemovePaletteMember: (paletteId: string) => void
  onSave: () => Promise<void>
  onSetCoverPalette: (paletteId: string) => void
}): ReactElement {
  return (
    <>
      <div className="grid gap-4 border-t border-[var(--dp-border-subtle)] pt-8 md:grid-cols-2">
        <TextInput label="中文名" onChange={(value) => onDraftFieldChange('nameZh', value)} value={draft.nameZh} />
        <TextInput label="英文名" onChange={(value) => onDraftFieldChange('nameEn', value)} value={draft.nameEn} />
        <SelectInput
          label="主题类型"
          onChange={(value) => onDraftFieldChange('themeType', value)}
          options={editorOptions.themeTypeOptions}
          value={draft.themeType}
        />
        <SelectInput
          label="发布模式"
          onChange={(value) => onDraftFieldChange('releaseMode', value)}
          options={editorOptions.releaseModeOptions}
          value={draft.releaseMode}
        />
        <SelectInput
          label="状态"
          onChange={(value) => onDraftFieldChange('status', value)}
          options={editorOptions.statusOptions}
          value={draft.status}
        />
        <SelectInput
          label="封面配色盘"
          onChange={(value) => onDraftFieldChange('coverPaletteId', value)}
          options={editorOptions.paletteOptions}
          value={draft.coverPaletteId}
        />
      </div>

      <label className="flex items-center justify-between gap-3 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3">
        <div>
          <SectionTitle>专业版标记</SectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">用于标记高优先级合集。</p>
        </div>
        <input
          checked={draft.isPro}
          className="size-4 accent-[var(--dp-fill-inverse)]"
          onChange={(event) => onDraftFieldChange('isPro', event.target.checked)}
          type="checkbox"
        />
      </label>

      <TextAreaInput
        label="中文描述"
        onChange={(value) => onDraftFieldChange('descriptionZh', value)}
        value={draft.descriptionZh ?? ''}
      />

      <TextAreaInput
        label="英文描述"
        onChange={(value) => onDraftFieldChange('descriptionEn', value)}
        value={draft.descriptionEn ?? ''}
      />

      <CollectionPaletteArrangement
        coverPaletteId={draft.coverPaletteId}
        onAddPalette={onAddPaletteMember}
        onMovePalette={onMovePaletteMember}
        onRemovePalette={onRemovePaletteMember}
        onSetCoverPalette={onSetCoverPalette}
        paletteIds={draft.paletteIds}
        paletteOptions={editorOptions.paletteOptions}
      />

      <MultiSelectChips
        label="场合标签"
        onToggle={(value) => onDraftTagToggle('occasionTags', value)}
        options={editorOptions.occasionOptions}
        selectedValues={draft.occasionTags}
      />

      <MultiSelectChips
        label="风格标签"
        onToggle={(value) => onDraftTagToggle('styleTags', value)}
        options={editorOptions.styleTagOptions}
        selectedValues={draft.styleTags}
      />

      <div className="border-b border-[var(--dp-border-subtle)] pb-8">
        <Button className="w-full" disabled={isSaving} onClick={() => void onSave()} variant="primary">
          {isSaving ? '正在保存…' : '保存合集'}
        </Button>
      </div>
    </>
  )
}

// Collection 删除保护区，负责承接引用检查、删除原因输入和软删除动作。
export function CollectionDeleteGuardSection({
  deleteCheck,
  deleteReason,
  isDeleteChecking,
  isDeleting,
  onCheckDeleteRisk,
  onDelete,
  onDeleteReasonChange,
}: {
  deleteCheck: CollectionDeleteCheckDto | null
  deleteReason: string
  isDeleteChecking: boolean
  isDeleting: boolean
  onCheckDeleteRisk: () => Promise<void>
  onDelete: () => Promise<void>
  onDeleteReasonChange: (value: string) => void
}): ReactElement {
  return (
    <div className="space-y-4 border border-amber-200 bg-amber-50/70 p-4">
      <div className="space-y-2">
        <SectionTitle>删除保护</SectionTitle>
        <p className="text-sm leading-6 text-foreground">
          删除前会先检查配色盘的来源引用。只有当前合集不再被任何启用中的配色盘作为来源合集使用时，才允许软删除。
        </p>
      </div>

      <TextInput label="删除原因" onChange={onDeleteReasonChange} value={deleteReason} />

      {deleteCheck ? (
        deleteCheck.canDelete ? (
          <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            当前未发现配色盘引用，可以执行软删除。
          </div>
        ) : (
          <div className="space-y-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>当前合集仍被以下配色盘引用，不能软删除：</p>
            <div className="space-y-2 text-xs leading-5">
              {deleteCheck.blockingReferences.map((reference) => (
                <div key={`${reference.id}-${reference.referenceField}`}>
                  {reference.id} / {reference.displayLabel} / {reference.referenceField}
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
          {isDeleting ? '正在软删除…' : '软删除合集'}
        </Button>
      </div>
    </div>
  )
}

// Collection 归档恢复区，负责展示已删除合集并提供恢复动作。
export function ArchivedCollectionsSection({
  archivedCollections,
  isRestoringId,
  onRestore,
}: {
  archivedCollections: CollectionDto[]
  isRestoringId: string | null
  onRestore: (id: string) => Promise<void>
}): ReactElement {
  return (
    <div className="space-y-3 border border-sky-200 bg-sky-50/70 p-4">
      <div className="space-y-2">
        <SectionTitle>已归档合集</SectionTitle>
        <p className="text-sm leading-6 text-foreground">已软删除的合集会出现在这里，恢复后会重新回到可编辑列表。</p>
      </div>

      {archivedCollections.length === 0 ? (
        <div className="border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-muted-foreground">
          当前没有已归档的合集。
        </div>
      ) : (
        <div className="space-y-3">
          {archivedCollections.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{item.nameZh}</p>
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
  )
}