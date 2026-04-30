import type { ReactElement } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card className="border-[var(--dp-border-hairline)] bg-white/80">
        <CardContent className="p-6 text-sm leading-6 text-muted-foreground">
          当前没有可展示的 Collection，请先检查后端返回是否为空。
        </CardContent>
      </Card>
    )
  }

  const paletteLabelMap = buildOptionLabelMap(editorOptions.paletteOptions)
  const releaseModeLabelMap = buildOptionLabelMap(editorOptions.releaseModeOptions)
  const statusLabelMap = buildOptionLabelMap(editorOptions.statusOptions)
  const themeTypeLabelMap = buildOptionLabelMap(editorOptions.themeTypeOptions)

  return (
    <Card className="overflow-hidden border-[var(--dp-border-hairline)] bg-white/88 shadow-paper">
      <CardHeader className="space-y-3 border-b border-[var(--dp-border-hairline)] bg-[linear-gradient(180deg,rgba(237,243,235,0.8),rgba(255,255,255,0.88))]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Collection Detail</p>
          <CardTitle className="display-font text-4xl tracking-[-0.04em] text-foreground">{draft.nameZh}</CardTitle>
          <p className="text-sm text-muted-foreground">{draft.nameEn}</p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          当前已支持合集详情编辑、Palette 来源引用检查、软删除与恢复，保存会直接回写 `collections.v1.json`。
        </p>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {saveMessage ? (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {saveMessage}
          </div>
        ) : null}

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
      </CardContent>
    </Card>
  )
}