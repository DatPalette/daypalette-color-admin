import type { ReactElement } from 'react'
import { RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BaseColorCard } from './components/BaseColorCard'
import { BaseColorDetailPanel } from './components/BaseColorDetailPanel'
import { useBaseColorsPageViewModel } from './view-model/useBaseColorsPageViewModel'

// 基础色管理页，负责组装列表、详情编辑和归档恢复三个页面区块。
export function BaseColorsPage(): ReactElement {
  const {
    archivedBaseColors,
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
    onSelectBaseColor,
    saveMessage,
  } = useBaseColorsPageViewModel()

  return (
    <div className="space-y-6 lg:space-y-8">
      <Card className="overflow-hidden border-[var(--dp-border-hairline)] bg-[linear-gradient(145deg,rgba(255,255,255,0.97),rgba(232,216,211,0.58))]">
        <CardContent className="grid gap-6 p-6 md:p-8 xl:grid-cols-[minmax(0,1.2fr)_320px] xl:items-end">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Base Colors</p>
            <div className="space-y-3">
              <h2 className="display-font max-w-[10ch] text-5xl leading-none tracking-[-0.05em] text-foreground md:text-6xl">
                Base Colors 已经补到读、改、删、增、恢复五段真实链路。
              </h2>
              <p className="max-w-[58ch] text-sm leading-7 text-muted-foreground md:text-base">
                当前这页已经覆盖真实列表读取、详情编辑、新增、删除前引用检查、软删除回写，以及已归档基础色恢复，后续重点会转向 Palettes / Collections 的编辑链路。
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
              刷新基础色
            </Button>
          </div>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Card className="border-red-200 bg-red-50/80 text-red-700">
          <CardContent className="p-5 text-sm leading-6">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Grid</p>
              <h3 className="display-font text-3xl tracking-[-0.04em] text-foreground">基础色列表</h3>
            </div>
            <Button onClick={onCreateDraft} variant="outline">
              新增基础色
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(model?.cards ?? []).map((card) => (
              <BaseColorCard
                key={card.id}
                isSelected={draft?.id === card.id}
                model={card}
                onSelect={onSelectBaseColor}
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
          <BaseColorDetailPanel
            archivedBaseColors={archivedBaseColors}
            deleteCheck={deleteCheck}
            deleteReason={deleteReason}
            draft={draft}
            editorOptions={editorOptions}
            isDeleteChecking={isDeleteChecking}
            isCreating={isCreating}
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