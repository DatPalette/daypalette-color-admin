import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  CollectionEditorOption,
  CollectionEditorOptions,
} from '@/models/collections'

function buildOptionLabelMap(options: CollectionEditorOption[]): Map<string, string> {
  return new Map(options.map((option) => [option.value, option.label]))
}

function resolveOptionLabel(optionLabelMap: Map<string, string>, value: string): string {
  return optionLabelMap.get(value) ?? value
}

function InfoRow({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--dp-border-hairline)] py-3 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  )
}

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

  return (
    <div className="rounded-[24px] border border-[var(--dp-border-hairline)] bg-[var(--dp-fill-panel)] px-5 py-3">
      <InfoRow label="Collection ID" value={draft.id} />
      <InfoRow label="Theme Type" value={resolveOptionLabel(themeTypeLabelMap, draft.themeType)} />
      <InfoRow label="Cover Palette" value={resolveOptionLabel(paletteLabelMap, draft.coverPaletteId)} />
      <InfoRow label="Release Mode" value={resolveOptionLabel(releaseModeLabelMap, draft.releaseMode)} />
      <InfoRow label="Status" value={resolveOptionLabel(statusLabelMap, draft.status)} />
      <InfoRow label="Pro" value={draft.isPro ? 'Yes' : 'No'} />
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
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="中文名" onChange={(value) => onDraftFieldChange('nameZh', value)} value={draft.nameZh} />
        <TextInput label="英文名" onChange={(value) => onDraftFieldChange('nameEn', value)} value={draft.nameEn} />
        <SelectInput
          label="Theme Type"
          onChange={(value) => onDraftFieldChange('themeType', value)}
          options={editorOptions.themeTypeOptions}
          value={draft.themeType}
        />
        <SelectInput
          label="Release Mode"
          onChange={(value) => onDraftFieldChange('releaseMode', value)}
          options={editorOptions.releaseModeOptions}
          value={draft.releaseMode}
        />
        <SelectInput
          label="Status"
          onChange={(value) => onDraftFieldChange('status', value)}
          options={editorOptions.statusOptions}
          value={draft.status}
        />
        <SelectInput
          label="Cover Palette"
          onChange={(value) => onDraftFieldChange('coverPaletteId', value)}
          options={editorOptions.paletteOptions}
          value={draft.coverPaletteId}
        />
      </div>

      <label className="flex items-center gap-3 rounded-[18px] border border-[var(--dp-border-hairline)] bg-[var(--dp-bg-page)] px-4 py-3">
        <input
          checked={draft.isPro}
          className="size-4 accent-[var(--dp-fill-inverse)]"
          onChange={(event) => onDraftFieldChange('isPro', event.target.checked)}
          type="checkbox"
        />
        <span>作为 Pro Collection 保留</span>
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
        label="Occasion Tags"
        onToggle={(value) => onDraftTagToggle('occasionTags', value)}
        options={editorOptions.occasionOptions}
        selectedValues={draft.occasionTags}
      />

      <MultiSelectChips
        label="Style Tags"
        onToggle={(value) => onDraftTagToggle('styleTags', value)}
        options={editorOptions.styleTagOptions}
        selectedValues={draft.styleTags}
      />

      <Button className="w-full" disabled={isSaving} onClick={() => void onSave()} variant="primary">
        {isSaving ? '正在保存…' : '保存 Collection'}
      </Button>
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
    <div className="space-y-4 rounded-[24px] border border-amber-200 bg-amber-50/70 p-4">
      <div className="space-y-2">
        <SectionTitle>Delete Guard</SectionTitle>
        <p className="text-sm leading-6 text-foreground">
          删除前会先检查 Palette 的来源引用。只有当前 Collection 不再被任何 active palette 作为 source collection 使用时，才允许软删除。
        </p>
      </div>

      <TextInput label="删除原因" onChange={onDeleteReasonChange} value={deleteReason} />

      {deleteCheck ? (
        deleteCheck.canDelete ? (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            当前未发现 Palette 引用，可以执行软删除。
          </div>
        ) : (
          <div className="space-y-3 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>当前 Collection 仍被以下 Palette 引用，不能软删除：</p>
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
          className="w-full"
          disabled={isDeleteChecking || isDeleting || !deleteCheck?.canDelete}
          onClick={() => void onDelete()}
          variant="outline"
        >
          {isDeleting ? '正在软删除…' : '软删除 Collection'}
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
    <div className="space-y-3 rounded-[24px] border border-sky-200 bg-sky-50/70 p-4">
      <div className="space-y-2">
        <SectionTitle>Archived Collections</SectionTitle>
        <p className="text-sm leading-6 text-foreground">已软删除的 Collection 会出现在这里，恢复后会重新回到可编辑列表。</p>
      </div>

      {archivedCollections.length === 0 ? (
        <div className="rounded-[18px] border border-sky-100 bg-white/70 px-4 py-3 text-sm text-muted-foreground">
          当前没有已归档的 Collection。
        </div>
      ) : (
        <div className="space-y-3">
          {archivedCollections.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-[18px] border border-sky-100 bg-white/80 px-4 py-3"
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