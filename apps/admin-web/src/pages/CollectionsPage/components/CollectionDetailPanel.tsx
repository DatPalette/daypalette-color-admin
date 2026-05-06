import type { ReactElement } from 'react'
import { X } from 'lucide-react'

import {
  ArchivedCollectionsSection,
  CollectionDeleteGuardSection,
  CollectionFormSection,
  CollectionSummarySection,
} from './CollectionDetailSections'
import type {
  CollectionDeleteCheckDto,
  CollectionDto,
  CollectionEditorOptions,
} from '@/models/collections'

// Collection 详情面板，负责编排摘要、编辑、删除保护和归档恢复四个区块。
export function CollectionDetailPanel({
  archivedCollections,
  deleteCheck,
  deleteReason,
  draft,
  editorOptions,
  isDeleteChecking,
  isDeleting,
  isRestoringId,
  isSaving,
  onAddPaletteMember,
  onCheckDeleteRisk,
  onClose,
  onDelete,
  onDeleteReasonChange,
  onDraftFieldChange,
  onDraftTagToggle,
  onMovePaletteMember,
  onRemovePaletteMember,
  onRestore,
  onSave,
  onSetCoverPalette,
  saveMessage,
}: {
  archivedCollections: CollectionDto[]
  deleteCheck: CollectionDeleteCheckDto | null
  deleteReason: string
  draft: CollectionDto | null
  editorOptions: CollectionEditorOptions | null
  isDeleteChecking: boolean
  isDeleting: boolean
  isRestoringId: string | null
  isSaving: boolean
  onAddPaletteMember: (paletteId: string) => void
  onCheckDeleteRisk: () => Promise<void>
  onClose: () => void
  onDelete: () => Promise<void>
  onDeleteReasonChange: (value: string) => void
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
  onRestore: (id: string) => Promise<void>
  onSave: () => Promise<void>
  onSetCoverPalette: (paletteId: string) => void
  saveMessage: string | null
}): ReactElement {
  if (!draft || !editorOptions) {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b border-[var(--dp-border-subtle)] px-6 py-5">
          <h2 className="display-font text-[2rem] leading-none tracking-[-0.03em] text-foreground">编辑合集</h2>
          <button className="text-muted-foreground hover:text-foreground" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-6 text-sm leading-6 text-muted-foreground">当前没有可展示的合集，请先检查后端返回是否为空。</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--dp-border-subtle)] px-6 py-5">
        <div className="space-y-2">
          <p className="label-caps text-muted-foreground">{draft.id}</p>
          <h2 className="display-font text-[2rem] leading-none tracking-[-0.03em] text-foreground">编辑合集</h2>
          <p className="text-sm text-muted-foreground">{draft.nameZh} / {draft.nameEn}</p>
        </div>

        <button className="text-muted-foreground hover:text-foreground" onClick={onClose} type="button">
          <X className="size-5" />
        </button>
        <p className="text-sm leading-6 text-muted-foreground">
          当前已支持合集详情编辑、配色盘来源引用检查、软删除与恢复，保存会直接回写 `collections.v1.json`。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {saveMessage ? (
          <div className="mb-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {saveMessage}
          </div>
        ) : null}

        <div className="space-y-8">
          <CollectionSummarySection draft={draft} editorOptions={editorOptions} />

          <CollectionFormSection
            draft={draft}
            editorOptions={editorOptions}
            isSaving={isSaving}
            onAddPaletteMember={onAddPaletteMember}
            onDraftFieldChange={onDraftFieldChange}
            onDraftTagToggle={onDraftTagToggle}
            onMovePaletteMember={onMovePaletteMember}
            onRemovePaletteMember={onRemovePaletteMember}
            onSave={onSave}
            onSetCoverPalette={onSetCoverPalette}
          />

          <CollectionDeleteGuardSection
            deleteCheck={deleteCheck}
            deleteReason={deleteReason}
            isDeleteChecking={isDeleteChecking}
            isDeleting={isDeleting}
            onCheckDeleteRisk={onCheckDeleteRisk}
            onDelete={onDelete}
            onDeleteReasonChange={onDeleteReasonChange}
          />

          <ArchivedCollectionsSection
            archivedCollections={archivedCollections}
            isRestoringId={isRestoringId}
            onRestore={onRestore}
          />
        </div>
      </div>
    </div>
  )
}