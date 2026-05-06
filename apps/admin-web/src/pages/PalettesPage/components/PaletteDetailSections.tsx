import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { WorkbenchInfoRow } from '@/components/workbench/WorkbenchInfoRow'
import {
  buildOptionLabelMap,
  getBooleanLabel,
  getPaletteSafetyLevelLabel,
  getPaletteSourceTypeLabel,
  resolveOptionLabel,
} from '@/utils/asset-display'
import {
  MultiSelectChips,
  SectionTitle,
  SelectInput,
  TextInput,
} from './PaletteEditorControls'
import type {
  PaletteDeleteCheckDto,
  PaletteDto,
  PaletteEditorOptions,
} from '@/models/palettes'

// Palette 摘要区，负责展示当前三色结果与只读元信息。
export function PaletteSummarySection({
  draft,
  editorOptions,
}: {
  draft: PaletteDto
  editorOptions: PaletteEditorOptions
}): ReactElement {
  const baseColorLabelMap = buildOptionLabelMap(editorOptions.baseColorOptions)
  const occasionLabelMap = buildOptionLabelMap(editorOptions.occasionOptions)
  const statusLabelMap = buildOptionLabelMap(editorOptions.statusOptions)
  const paletteRows = [
    { label: '主色', value: resolveOptionLabel(baseColorLabelMap, draft.primaryColorId), color: 'var(--dp-palette-main)' },
    { label: '辅色', value: resolveOptionLabel(baseColorLabelMap, draft.secondaryColorId), color: 'var(--dp-palette-secondary)' },
    { label: '强调色', value: resolveOptionLabel(baseColorLabelMap, draft.accentColorId), color: 'var(--dp-palette-accent)' },
  ]

  return (
    <>
      <div className="space-y-3 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] p-4">
        {paletteRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 border border-[var(--dp-border-subtle)] bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="size-10 border border-black/5" style={{ backgroundColor: row.color }} />
              <div>
                <p className="label-caps text-muted-foreground">{row.label}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{row.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-5 py-3">
        <WorkbenchInfoRow label="配色盘 ID" value={draft.id} />
        <WorkbenchInfoRow label="场合" value={resolveOptionLabel(occasionLabelMap, draft.occasionId)} />
        <WorkbenchInfoRow label="安全等级" value={getPaletteSafetyLevelLabel(draft.safetyLevel)} />
        <WorkbenchInfoRow label="来源类型" value={getPaletteSourceTypeLabel(draft.sourceType)} />
        <WorkbenchInfoRow label="状态" value={resolveOptionLabel(statusLabelMap, draft.status)} />
        <WorkbenchInfoRow label="专业版" value={getBooleanLabel(draft.isPro)} />
        <WorkbenchInfoRow label="适配拍照场景" value={getBooleanLabel(draft.fitPhotoScenario)} />
      </div>
    </>
  )
}

// Palette 编辑区，负责承接可编辑字段、标签选择和保存动作。
export function PaletteFormSection({
  draft,
  editorOptions,
  isCreating,
  isSaving,
  onDraftFieldChange,
  onDraftTagToggle,
  onSave,
}: {
  draft: PaletteDto
  editorOptions: PaletteEditorOptions
  isCreating: boolean
  isSaving: boolean
  onDraftFieldChange: (
    field:
      | 'accentColorId'
      | 'fitPhotoScenario'
      | 'id'
      | 'isPro'
      | 'occasionId'
      | 'primaryColorId'
      | 'safetyLevel'
      | 'secondaryColorId'
      | 'slug'
      | 'sourceType'
      | 'status',
    value: boolean | string,
  ) => void
  onDraftTagToggle: (field: 'moodTags' | 'seasonTags' | 'sourceCollectionIds' | 'styleTags', value: string) => void
  onSave: () => Promise<void>
}): ReactElement {
  return (
    <>
      <div className="grid gap-4 border-t border-[var(--dp-border-subtle)] pt-8 md:grid-cols-2">
        <TextInput
          disabled={!isCreating}
          label="ID"
          onChange={(value) => onDraftFieldChange('id', value)}
          value={draft.id}
        />
        <TextInput label="标识 Slug" onChange={(value) => onDraftFieldChange('slug', value)} value={draft.slug} />
        <TextInput
          label="安全等级"
          onChange={(value) => onDraftFieldChange('safetyLevel', value)}
          value={draft.safetyLevel}
        />
        <TextInput
          label="来源类型"
          onChange={(value) => onDraftFieldChange('sourceType', value)}
          value={draft.sourceType}
        />
        <SelectInput
          label="场合"
          onChange={(value) => onDraftFieldChange('occasionId', value)}
          options={editorOptions.occasionOptions}
          value={draft.occasionId}
        />
        <SelectInput
          label="状态"
          onChange={(value) => onDraftFieldChange('status', value)}
          options={editorOptions.statusOptions}
          value={draft.status}
        />
        <SelectInput
          label="主色"
          onChange={(value) => onDraftFieldChange('primaryColorId', value)}
          options={editorOptions.baseColorOptions}
          value={draft.primaryColorId}
        />
        <SelectInput
          label="辅色"
          onChange={(value) => onDraftFieldChange('secondaryColorId', value)}
          options={editorOptions.baseColorOptions}
          value={draft.secondaryColorId}
        />
        <SelectInput
          label="强调色"
          onChange={(value) => onDraftFieldChange('accentColorId', value)}
          options={editorOptions.baseColorOptions}
          value={draft.accentColorId}
        />
      </div>

      <label className="flex items-center justify-between gap-3 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3">
        <div>
          <SectionTitle>专业版标记</SectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">高价值配色可单独标记为专业版内容。</p>
        </div>
        <input
          checked={draft.isPro}
          className="size-4 accent-[var(--dp-fill-inverse)]"
          onChange={(event) => onDraftFieldChange('isPro', event.target.checked)}
          type="checkbox"
        />
      </label>

      <label className="flex items-center justify-between gap-3 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3">
        <div>
          <SectionTitle>照片适配</SectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">适合作为拍照场景推荐时启用。</p>
        </div>
        <input
          checked={draft.fitPhotoScenario}
          className="size-4 accent-[var(--dp-fill-inverse)]"
          onChange={(event) => onDraftFieldChange('fitPhotoScenario', event.target.checked)}
          type="checkbox"
        />
      </label>

      <div className="space-y-6 border-b border-[var(--dp-border-subtle)] pb-8">
        <MultiSelectChips
          label="心情标签"
          onToggle={(value) => onDraftTagToggle('moodTags', value)}
          options={editorOptions.moodTagOptions}
          selectedValues={draft.moodTags}
        />

        <MultiSelectChips
          label="风格标签"
          onToggle={(value) => onDraftTagToggle('styleTags', value)}
          options={editorOptions.styleTagOptions}
          selectedValues={draft.styleTags}
        />

        <MultiSelectChips
          label="季节标签"
          onToggle={(value) => onDraftTagToggle('seasonTags', value)}
          options={editorOptions.seasonTagOptions}
          selectedValues={draft.seasonTags}
        />

        <MultiSelectChips
          label="来源合集"
          onToggle={(value) => onDraftTagToggle('sourceCollectionIds', value)}
          options={editorOptions.sourceCollectionOptions}
          selectedValues={draft.sourceCollectionIds}
        />

        <Button className="w-full" disabled={isSaving} onClick={() => void onSave()} variant="primary">
          {isSaving ? '正在保存…' : isCreating ? '创建配色盘' : '保存配色盘'}
        </Button>
      </div>
    </>
  )
}

// Palette 删除保护区，负责承接引用检查、删除原因输入和软删除动作。
export function PaletteDeleteGuardSection({
  deleteCheck,
  deleteReason,
  isDeleteChecking,
  isDeleting,
  onCheckDeleteRisk,
  onDelete,
  onDeleteReasonChange,
}: {
  deleteCheck: PaletteDeleteCheckDto | null
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
          删除前会先检查合集引用。只有当前配色盘不再被任何启用中的合集使用时，才允许软删除。
        </p>
      </div>

      <TextInput label="删除原因" onChange={onDeleteReasonChange} value={deleteReason} />

      {deleteCheck ? (
        deleteCheck.canDelete ? (
          <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            当前未发现合集引用，可以执行软删除。
          </div>
        ) : (
          <div className="space-y-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>当前配色盘仍被以下合集引用，不能软删除：</p>
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
          {isDeleting ? '正在软删除…' : '软删除配色盘'}
        </Button>
      </div>
    </div>
  )
}

// Palette 归档恢复区，负责展示已删除 Palette 并提供恢复动作。
export function ArchivedPalettesSection({
  archivedPalettes,
  isRestoringId,
  onRestore,
}: {
  archivedPalettes: PaletteDto[]
  isRestoringId: string | null
  onRestore: (id: string) => Promise<void>
}): ReactElement {
  return (
    <div className="space-y-3 border border-sky-200 bg-sky-50/70 p-4">
      <div className="space-y-2">
        <SectionTitle>已归档配色盘</SectionTitle>
        <p className="text-sm leading-6 text-foreground">已软删除的配色盘会出现在这里，恢复后会重新回到可编辑列表。</p>
      </div>

      {archivedPalettes.length === 0 ? (
        <div className="border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3 text-sm text-muted-foreground">
          当前没有已归档的配色盘。
        </div>
      ) : (
        <div className="space-y-3">
          {archivedPalettes.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 border border-[var(--dp-border-subtle)] bg-[var(--dp-surface-soft)] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{item.slug}</p>
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