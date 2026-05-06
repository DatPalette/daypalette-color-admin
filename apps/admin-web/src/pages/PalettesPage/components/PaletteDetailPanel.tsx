import type { ReactElement } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
  onClose,
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
  onClose: () => void
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
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b border-[var(--dp-border-subtle)] px-6 py-5">
          <h2 className="display-font text-[2rem] leading-none tracking-[-0.03em] text-foreground">Edit Palette</h2>
          <button className="text-muted-foreground hover:text-foreground" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-6 text-sm leading-6 text-muted-foreground">当前没有可展示的 Palette，请先检查后端返回是否为空。</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--dp-border-subtle)] px-6 py-5">
        <div className="space-y-2">
          <p className="label-caps text-muted-foreground">{draft.id}</p>
          <h2 className="display-font text-[2rem] leading-none tracking-[-0.03em] text-foreground">Edit Palette</h2>
          <p className="text-sm text-muted-foreground">{draft.slug}</p>
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
        <p className="text-sm leading-6 text-muted-foreground">
          {isCreating
            ? '保存会创建新 Palette 并直接写回 palettes.v1.json。'
            : '当前已进入 Palette 编辑、删除保护与恢复链路，保存会直接回写 palettes.v1.json。'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {saveMessage ? (
          <div className="mb-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {saveMessage}
          </div>
        ) : null}

        <div className="space-y-8">
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
        </div>
      </div>
    </div>
  )
}