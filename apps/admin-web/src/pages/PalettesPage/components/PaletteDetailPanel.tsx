import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArchivedPalettesSection,
  PaletteDeleteGuardSection,
  PaletteFormSection,
  PaletteSummarySection,
} from './PaletteDetailSections'
import type {
  PaletteDeleteCheckDto,
  PaletteDto,
  PaletteEditorOptions,
} from '@/models/palettes'

// Palette 详情面板，负责编排摘要、编辑、删除保护和归档恢复四个区块。
export function PaletteDetailPanel({
  archivedPalettes,
  deleteCheck,
  deleteReason,
  draft,
  editorOptions,
  isCreating,
  isDeleteChecking,
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
  archivedPalettes: PaletteDto[]
  deleteCheck: PaletteDeleteCheckDto | null
  deleteReason: string
  draft: PaletteDto | null
  editorOptions: PaletteEditorOptions | null
  isCreating: boolean
  isDeleteChecking: boolean
  isDeleting: boolean
  isRestoringId: string | null
  isSaving: boolean
  onCreateDraft: () => void
  onCheckDeleteRisk: () => Promise<void>
  onDelete: () => Promise<void>
  onDeleteReasonChange: (value: string) => void
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
  onRestore: (id: string) => Promise<void>
  onSave: () => Promise<void>
  saveMessage: string | null
}): ReactElement {
  if (!draft || !editorOptions) {
    return (
      <Card className="border-[var(--dp-border-hairline)] bg-white/80">
        <CardContent className="p-6 text-sm leading-6 text-muted-foreground">
          当前没有可展示的 Palette，请先检查后端返回是否为空。
        </CardContent>
      </Card>
    )
  }

  const baseColorLabelMap = buildOptionLabelMap(editorOptions.baseColorOptions)
  const occasionLabelMap = buildOptionLabelMap(editorOptions.occasionOptions)
  const statusLabelMap = buildOptionLabelMap(editorOptions.statusOptions)

  return (
    <Card className="overflow-hidden border-[var(--dp-border-hairline)] bg-white/88 shadow-paper">
      <CardHeader className="space-y-3 border-b border-[var(--dp-border-hairline)] bg-[linear-gradient(180deg,rgba(244,239,232,0.8),rgba(255,255,255,0.88))]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Palette Detail</p>
            <CardTitle className="display-font text-4xl tracking-[-0.04em] text-foreground">
              {isCreating ? '新增 Palette' : draft.slug}
            </CardTitle>
          </div>
          {!isCreating ? (
            <Button onClick={onCreateDraft} variant="outline">
              新增 Palette
            </Button>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {isCreating
            ? '保存会创建新 Palette 并直接写回 palettes.v1.json。'
            : '当前已进入 Palette 编辑、删除保护与恢复链路，保存会直接回写 palettes.v1.json。'}
        </p>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {saveMessage ? (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {saveMessage}
          </div>
        ) : null}

        <PaletteSummarySection draft={draft} editorOptions={editorOptions} />

        <PaletteFormSection
          draft={draft}
          editorOptions={editorOptions}
          isCreating={isCreating}
          isSaving={isSaving}
          onDraftFieldChange={onDraftFieldChange}
          onDraftTagToggle={onDraftTagToggle}
          onSave={onSave}
        />

        {!isCreating ? (
          <PaletteDeleteGuardSection
            deleteCheck={deleteCheck}
            deleteReason={deleteReason}
            isDeleteChecking={isDeleteChecking}
            isDeleting={isDeleting}
            onCheckDeleteRisk={onCheckDeleteRisk}
            onDelete={onDelete}
            onDeleteReasonChange={onDeleteReasonChange}
          />
        ) : null}

        <ArchivedPalettesSection
          archivedPalettes={archivedPalettes}
          isRestoringId={isRestoringId}
          onRestore={onRestore}
        />
      </CardContent>
    </Card>
  )
}