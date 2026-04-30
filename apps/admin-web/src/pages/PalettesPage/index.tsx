import type { ReactElement } from 'react'
import { RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PaletteCard } from './components/PaletteCard'
import { PaletteDetailPanel } from './components/PaletteDetailPanel'
import { usePalettesPageViewModel } from './view-model/usePalettesPageViewModel'

// 配色盘管理页，负责组装列表、新增编辑面板和归档恢复区块。
export function PalettesPage(): ReactElement {
  const {
    archivedPalettes,
    deleteCheck,
    deleteReason,
    draft,
    editorOptions,
    errorMessage,
    isCreating,
    isDeleteChecking,
    isDeleting,
    isLoading,
    isRestoringId,
    isSaving,
    model,
    onCreateDraft,
    onCheckDeleteRisk,
    onDelete,
    onDeleteReasonChange,
    onDraftFieldChange,
    onDraftTagToggle,
    onRefresh,
    onRestore,
    onSave,
    onSelectPalette,
    saveMessage,
  } = usePalettesPageViewModel()

  return (
    <div className="space-y-6 lg:space-y-8">
      <Card className="overflow-hidden border-[var(--dp-border-hairline)] bg-[linear-gradient(145deg,rgba(255,255,255,0.97),rgba(220,224,236,0.58))]">
        <CardContent className="grid gap-6 p-6 md:p-8 xl:grid-cols-[minmax(0,1.2fr)_320px] xl:items-end">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Palettes</p>
            <div className="space-y-3">
              <h2 className="display-font max-w-[10ch] text-5xl leading-none tracking-[-0.05em] text-foreground md:text-6xl">
                Palettes 已补上新增、编辑、删除保护与恢复链路。
              </h2>
              <p className="max-w-[58ch] text-sm leading-7 text-muted-foreground md:text-base">
                当前已支持真实 Palette 列表读取、新增、详情编辑、Collection 引用检查、软删除和恢复，第三条真实写回链路已经完整成型。
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-[28px] border border-white/80 bg-white/70 p-5 backdrop-blur-md">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Dataset</p>
              <p className="text-lg font-medium text-foreground">{model?.totalLabel ?? '读取中'}</p>
              <p className="text-sm text-muted-foreground">最近更新时间：{model?.updatedAtLabel ?? '等待返回'}</p>
            </div>
            <Button className="w-full" onClick={() => void onRefresh()} variant="primary">
              <RefreshCcw className="size-4" />
              刷新 Palettes
            </Button>
          </div>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Card className="border-red-200 bg-red-50/80 text-red-700">
          <CardContent className="p-5 text-sm leading-6">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Grid</p>
              <h3 className="display-font text-3xl tracking-[-0.04em] text-foreground">真实 Palette 列表</h3>
            </div>
            <Button onClick={onCreateDraft} variant="outline">
              新增 Palette
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(model?.cards ?? []).map((card) => (
              <PaletteCard
                key={card.id}
                isSelected={draft?.id === card.id && !isCreating}
                model={card}
                onSelect={onSelectPalette}
              />
            ))}

            {isLoading && !model
              ? Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="min-h-[220px] animate-pulse bg-white/60" />
                ))
              : null}
          </div>
        </section>

        <section className="xl:sticky xl:top-8 xl:self-start">
          <PaletteDetailPanel
            archivedPalettes={archivedPalettes}
            deleteCheck={deleteCheck}
            deleteReason={deleteReason}
            draft={draft}
            editorOptions={editorOptions}
            isCreating={isCreating}
            isDeleteChecking={isDeleteChecking}
            isDeleting={isDeleting}
            isRestoringId={isRestoringId}
            isSaving={isSaving}
            onCreateDraft={onCreateDraft}
            onCheckDeleteRisk={onCheckDeleteRisk}
            onDelete={onDelete}
            onDeleteReasonChange={onDeleteReasonChange}
            onDraftFieldChange={onDraftFieldChange}
            onDraftTagToggle={onDraftTagToggle}
            onRestore={onRestore}
            onSave={onSave}
            saveMessage={saveMessage}
          />
        </section>
      </div>
    </div>
  )
}