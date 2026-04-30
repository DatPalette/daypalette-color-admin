import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  MultiSelectChips,
  SectionTitle,
  SelectInput,
  TextInput,
} from './PaletteEditorControls'
import type {
  PaletteDeleteCheckDto,
  PaletteDto,
  PaletteEditorOption,
  PaletteEditorOptions,
} from '@/models/palettes'

function buildOptionLabelMap(options: PaletteEditorOption[]): Map<string, string> {
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

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[var(--dp-border-hairline)] bg-[var(--dp-fill-soft)]">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Primary</p>
            <p className="font-medium text-foreground">{resolveOptionLabel(baseColorLabelMap, draft.primaryColorId)}</p>
          </CardContent>
        </Card>
        <Card className="border-[var(--dp-border-hairline)] bg-[var(--dp-fill-soft)]">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Secondary</p>
            <p className="font-medium text-foreground">{resolveOptionLabel(baseColorLabelMap, draft.secondaryColorId)}</p>
          </CardContent>
        </Card>
        <Card className="border-[var(--dp-border-hairline)] bg-[var(--dp-fill-soft)]">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Accent</p>
            <p className="font-medium text-foreground">{resolveOptionLabel(baseColorLabelMap, draft.accentColorId)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-[24px] border border-[var(--dp-border-hairline)] bg-[var(--dp-fill-panel)] px-5 py-3">
        <InfoRow label="Palette ID" value={draft.id} />
        <InfoRow label="Occasion" value={resolveOptionLabel(occasionLabelMap, draft.occasionId)} />
        <InfoRow label="Safety Level" value={draft.safetyLevel} />
        <InfoRow label="Source Type" value={draft.sourceType} />
        <InfoRow label="Status" value={resolveOptionLabel(statusLabelMap, draft.status)} />
        <InfoRow label="Pro" value={draft.isPro ? 'Yes' : 'No'} />
        <InfoRow label="Fit Photo Scenario" value={draft.fitPhotoScenario ? 'Yes' : 'No'} />
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
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          disabled={!isCreating}
          label="ID"
          onChange={(value) => onDraftFieldChange('id', value)}
          value={draft.id}
        />
        <TextInput label="Slug" onChange={(value) => onDraftFieldChange('slug', value)} value={draft.slug} />
        <TextInput
          label="Safety Level"
          onChange={(value) => onDraftFieldChange('safetyLevel', value)}
          value={draft.safetyLevel}
        />
        <TextInput
          label="Source Type"
          onChange={(value) => onDraftFieldChange('sourceType', value)}
          value={draft.sourceType}
        />
        <SelectInput
          label="Occasion"
          onChange={(value) => onDraftFieldChange('occasionId', value)}
          options={editorOptions.occasionOptions}
          value={draft.occasionId}
        />
        <SelectInput
          label="Status"
          onChange={(value) => onDraftFieldChange('status', value)}
          options={editorOptions.statusOptions}
          value={draft.status}
        />
        <SelectInput
          label="Primary Color"
          onChange={(value) => onDraftFieldChange('primaryColorId', value)}
          options={editorOptions.baseColorOptions}
          value={draft.primaryColorId}
        />
        <SelectInput
          label="Secondary Color"
          onChange={(value) => onDraftFieldChange('secondaryColorId', value)}
          options={editorOptions.baseColorOptions}
          value={draft.secondaryColorId}
        />
        <SelectInput
          label="Accent Color"
          onChange={(value) => onDraftFieldChange('accentColorId', value)}
          options={editorOptions.baseColorOptions}
          value={draft.accentColorId}
        />
      </div>

      <label className="flex items-center gap-3 rounded-[18px] border border-[var(--dp-border-hairline)] bg-[var(--dp-bg-page)] px-4 py-3">
        <input
          checked={draft.isPro}
          className="size-4 accent-[var(--dp-fill-inverse)]"
          onChange={(event) => onDraftFieldChange('isPro', event.target.checked)}
          type="checkbox"
        />
        <span>作为 Pro Palette 保留</span>
      </label>

      <label className="flex items-center gap-3 rounded-[18px] border border-[var(--dp-border-hairline)] bg-[var(--dp-bg-page)] px-4 py-3">
        <input
          checked={draft.fitPhotoScenario}
          className="size-4 accent-[var(--dp-fill-inverse)]"
          onChange={(event) => onDraftFieldChange('fitPhotoScenario', event.target.checked)}
          type="checkbox"
        />
        <span>适合作为拍照场景推荐</span>
      </label>

      <MultiSelectChips
        label="Mood Tags"
        onToggle={(value) => onDraftTagToggle('moodTags', value)}
        options={editorOptions.moodTagOptions}
        selectedValues={draft.moodTags}
      />

      <MultiSelectChips
        label="Style Tags"
        onToggle={(value) => onDraftTagToggle('styleTags', value)}
        options={editorOptions.styleTagOptions}
        selectedValues={draft.styleTags}
      />

      <MultiSelectChips
        label="Season Tags"
        onToggle={(value) => onDraftTagToggle('seasonTags', value)}
        options={editorOptions.seasonTagOptions}
        selectedValues={draft.seasonTags}
      />

      <MultiSelectChips
        label="Source Collections"
        onToggle={(value) => onDraftTagToggle('sourceCollectionIds', value)}
        options={editorOptions.sourceCollectionOptions}
        selectedValues={draft.sourceCollectionIds}
      />

      <Button className="w-full" disabled={isSaving} onClick={() => void onSave()} variant="primary">
        {isSaving ? '正在保存…' : isCreating ? '创建 Palette' : '保存 Palette'}
      </Button>
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
    <div className="space-y-4 rounded-[24px] border border-amber-200 bg-amber-50/70 p-4">
      <div className="space-y-2">
        <SectionTitle>Delete Guard</SectionTitle>
        <p className="text-sm leading-6 text-foreground">
          删除前会先检查 Collection 引用。只有当前 Palette 不再被任何 active collection 使用时，才允许软删除。
        </p>
      </div>

      <TextInput label="删除原因" onChange={onDeleteReasonChange} value={deleteReason} />

      {deleteCheck ? (
        deleteCheck.canDelete ? (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            当前未发现 Collection 引用，可以执行软删除。
          </div>
        ) : (
          <div className="space-y-3 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>当前 Palette 仍被以下 Collection 引用，不能软删除：</p>
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
          {isDeleting ? '正在软删除…' : '软删除 Palette'}
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
    <div className="space-y-3 rounded-[24px] border border-sky-200 bg-sky-50/70 p-4">
      <div className="space-y-2">
        <SectionTitle>Archived Palettes</SectionTitle>
        <p className="text-sm leading-6 text-foreground">已软删除的 Palette 会出现在这里，恢复后会重新回到可编辑列表。</p>
      </div>

      {archivedPalettes.length === 0 ? (
        <div className="rounded-[18px] border border-sky-100 bg-white/70 px-4 py-3 text-sm text-muted-foreground">
          当前没有已归档的 Palette。
        </div>
      ) : (
        <div className="space-y-3">
          {archivedPalettes.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-[18px] border border-sky-100 bg-white/80 px-4 py-3"
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